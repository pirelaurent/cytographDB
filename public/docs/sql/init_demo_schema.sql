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

-- FACTORIES
CREATE TABLE factory (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company_id INT NOT NULL REFERENCES company(id) ON DELETE CASCADE
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
    name TEXT NOT NULL,
    factory_id INT NOT NULL REFERENCES factory(id) ON DELETE CASCADE,
    activity_points INT DEFAULT 0 NOT NULL
);

-- Add a reflexive looping link 
ALTER TABLE employee
ADD COLUMN works_with_id INT REFERENCES employee(id) ON DELETE SET NULL;

-- add an reflexive association with on delete cascade
ALTER TABLE employee
ADD COLUMN chief_id INT REFERENCES employee(id) ON DELETE CASCADE;




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
