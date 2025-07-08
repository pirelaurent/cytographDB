-- once democytodb db created , create tables and triggers
--- psql -U postgres -d democytodb -f ./public/docs/sql/init_demo_schema.sql 

----------------------------------------
---- once DB created with a connection on another available DB
----
----****  BE SURE TO MOVE TO democytodb **** to run these scripts
----  \c democytodb   in psql 
----  connect to democytodb in admin tools like pgAdmin 
----------------------------------------

-- Supprimer les triggers
DROP TRIGGER IF EXISTS trg_increment_points ON intervention;
DROP TRIGGER IF EXISTS trg_check_authorization ON intervention;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS increment_activity_points() CASCADE;
DROP FUNCTION IF EXISTS check_authorization_before_intervention() CASCADE;

-- Supprimer les tables (dans l'ordre des dépendances inverses)
DROP TABLE IF EXISTS intervention;
DROP TABLE IF EXISTS "authorization";
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS line_product;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS production_line;
DROP TABLE IF EXISTS factory;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS parameters;


-- COMPANIES
CREATE TABLE company (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- FACTORIES. can be sold to another company. weak link.
CREATE TABLE factory (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company_id INT NOT NULL REFERENCES company(id) ON DELETE SET NULL
);

-- PRODUCTION LINES
CREATE TABLE production_line (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    factory_id INT NOT NULL REFERENCES factory(id) ON DELETE CASCADE
);

-- PRODUCTS
CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- LINKING TABLE: which products are made by which production lines
CREATE TABLE line_product (
    production_line_id INT NOT NULL REFERENCES production_line(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    PRIMARY KEY (production_line_id, product_id)
);

-- EMPLOYEES
CREATE TABLE employee (
    id SERIAL PRIMARY KEY,
    -- PostgreSQL will automatically create a constraint named employee_pkey under the hood. 
    name TEXT NOT NULL,
    factory_id INT NOT NULL REFERENCES factory(id),
    activity_points INT DEFAULT 0 NOT NULL
);

-- Add a reflexive looping link 
ALTER TABLE employee
ADD COLUMN works_with_id INT REFERENCES employee(id) ON DELETE SET NULL;

-- add an reflexive association . If chief deleted keep employees
ALTER TABLE employee
ADD COLUMN chief_id INT REFERENCES employee(id) ON DELETE SET NULL;




-- AUTHORIZATIONS: which production lines each employee is authorized to work on
CREATE TABLE "authorization" (
    employee_id INT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    production_line_id INT NOT NULL REFERENCES production_line(id) ON DELETE CASCADE,
    PRIMARY KEY (employee_id, production_line_id)
);

-- INTERVENTIONS performed by employees
CREATE TABLE intervention (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    production_line_id INT NOT NULL REFERENCES production_line(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL DEFAULT now()
);
-- create a table with no links
   CREATE TABLE parameters (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    value TEXT 
);




-- TRIGGER FUNCTION: Increment activity points after each intervention
CREATE OR REPLACE FUNCTION increment_activity_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE employee
    SET activity_points = activity_points + 10
    WHERE id = NEW.employee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_points
AFTER INSERT ON intervention
FOR EACH ROW
EXECUTE FUNCTION increment_activity_points();

-- TRIGGER FUNCTION: Validate authorization before allowing the intervention
CREATE OR REPLACE FUNCTION check_authorization_before_intervention()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "authorization"
        WHERE employee_id = NEW.employee_id
          AND production_line_id = NEW.production_line_id
    ) THEN
        RAISE EXCEPTION 'Employee % is not authorized on production line %',
            NEW.employee_id, NEW.production_line_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_authorization
BEFORE INSERT ON intervention
FOR EACH ROW
EXECUTE FUNCTION check_authorization_before_intervention();


-- ADD COMMENTS ON TABLES

COMMENT ON TABLE company IS 'Represents a company, the top-level entity in the industrial model.';
COMMENT ON TABLE factory IS 'A factory owned by a company. Contains one or more production lines.';
COMMENT ON TABLE production_line IS 'A production line within a factory, producing one or more products.';
COMMENT ON TABLE product IS 'A product manufactured on one or more production lines.';
COMMENT ON TABLE line_product IS 'Join table mapping which production lines manufacture which products.';
COMMENT ON TABLE employee IS 'An employee assigned to a factory, allowed to perform interventions.';
COMMENT ON TABLE "authorization" IS 'Authorization matrix defining which lines each employee is allowed to operate on.';
COMMENT ON TABLE intervention IS 'Records of interventions performed by employees on production lines.';
COMMENT ON TABLE parameters IS 'General configuration parameters for the application.';

-- ADD COMMENTS ON COLUMNS IN TABLES 

-- employee table
COMMENT ON COLUMN employee.activity_points IS 'Points earned by the employee for completed interventions.';
COMMENT ON COLUMN employee.works_with_id IS 'Optional link to another employee that this one collaborates with.';
COMMENT ON COLUMN employee.chief_id IS 'Supervisor or team leader of this employee (nullable).';

-- intervention table
COMMENT ON COLUMN intervention.date IS 'Timestamp of the intervention. Defaults to the current time.';

-- factory table
COMMENT ON COLUMN factory.company_id IS 'References the owning company. Can be null if the factory is transferred.';

-- authorization table
COMMENT ON COLUMN "authorization".employee_id IS 'Employee authorized to work on the production line.';
COMMENT ON COLUMN "authorization".production_line_id IS 'Production line that the employee is authorized to access.';

-- line_product table
COMMENT ON COLUMN line_product.production_line_id IS 'Production line responsible for manufacturing the product.';
COMMENT ON COLUMN line_product.product_id IS 'Product manufactured by the production line.';

-- ADD COMMENTS ON TRIGGERS 

COMMENT ON FUNCTION increment_activity_points() IS 'Trigger function to increment an employee''s activity points after each intervention.';
COMMENT ON FUNCTION check_authorization_before_intervention() IS 'Trigger function to validate whether the employee is authorized for the specified production line.';

COMMENT ON TRIGGER trg_increment_points ON intervention IS 'Trigger that adds activity points to the employee after a new intervention is recorded.';
COMMENT ON TRIGGER trg_check_authorization ON intervention IS 'Trigger that checks employee authorization before allowing an intervention.';

-- COMMENTS ON FK

COMMENT ON CONSTRAINT employee_works_with_id_fkey ON employee IS 'Indicates another employee this person works with (optional link).';
COMMENT ON CONSTRAINT employee_chief_id_fkey ON employee IS 'References the chief of this employee. If the chief is deleted, this link becomes NULL.';

-- COMMENTS ON PK 

COMMENT ON CONSTRAINT employee_pkey ON employee IS 'Primary key ensuring each employee has a unique identifier.';

-- COMMENT ON INDEX

COMMENT ON INDEX employee_pkey IS 'Index to speed up id-based searches';