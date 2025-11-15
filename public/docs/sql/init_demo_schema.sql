-- -----------------------------
-- Check BASE
-- DB created separately 
--      DROP DATABASE democytoDB;
--      CREATE DATABASE democytoDB;
-- 
-- connect to democytoDB and run this script to create the demo schema
-- -----------------------------
DO $$
BEGIN
    IF current_database() <> 'democytoDB' THEN
        RAISE EXCEPTION
            '❌ bad Database : this script must be executed on democytoDB, Not on  : %',
            current_database();
    END IF;
END;
$$;


-- -----------------------------
-- DROP EXISTANT (SI REEXECUTION)
-- -----------------------------

DROP TRIGGER IF EXISTS trg_increment_points ON intervention;
DROP TRIGGER IF EXISTS trg_check_authorization ON intervention;

DROP FUNCTION IF EXISTS increment_activity_points() CASCADE;
DROP FUNCTION IF EXISTS check_authorization_before_intervention() CASCADE;

DROP TABLE IF EXISTS intervention;
DROP TABLE IF EXISTS "authorization";
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS line_product;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS production_line;
DROP TABLE IF EXISTS factory;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS parameters;

-- -----------------------------
-- TABLES
-- -----------------------------

CREATE TABLE company (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE factory (
      company_id INT NOT NULL 
      CONSTRAINT fk_fact_comp
       REFERENCES company(id) ON DELETE CASCADE,
    id INT NOT NULL,
    name VARCHAR(20) NOT NULL,
    PRIMARY KEY (company_id, id)
);

CREATE TABLE production_line (
    company_id INT NOT NULL,
    factory_id INT NOT NULL,
    id INT NOT NULL,
    name VARCHAR(20) NOT NULL,
    PRIMARY KEY (company_id, factory_id, id),
    CONSTRAINT fk_prod_comp_fact
     FOREIGN KEY (company_id, factory_id) REFERENCES factory(company_id, id)
);

CREATE TABLE product (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE line_product (
    company_id INT NOT NULL,
    factory_id INT NOT NULL,
    production_line_id INT NOT NULL,
    product_id INT NOT NULL,
    PRIMARY KEY (company_id, factory_id, production_line_id, product_id),
    CONSTRAINT fk_line_prod_comp_fact_prod_line
     FOREIGN KEY (company_id, factory_id, production_line_id) REFERENCES production_line(company_id, factory_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_line_prod_prod
     FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

CREATE TABLE employee (
    company_id INT NOT NULL,
    id INT NOT NULL,
    first_name VARCHAR(20) NOT NULL,
    name VARCHAR(20) NOT NULL,
    factory_id INT NOT NULL,
    activity_points INT DEFAULT 0 NOT NULL,
    PRIMARY KEY (company_id, id),
    CONSTRAINT fk_comp_fact
     FOREIGN KEY (company_id, factory_id) REFERENCES factory(company_id, id)
);

ALTER TABLE employee ADD COLUMN works_with_company_id INT;
ALTER TABLE employee ADD COLUMN works_with_id INT;
ALTER TABLE employee ADD CONSTRAINT fk_emp_works_with
    FOREIGN KEY (works_with_company_id, works_with_id)
    REFERENCES employee(company_id, id) ON DELETE SET NULL;

ALTER TABLE employee ADD COLUMN chief_company_id INT;
ALTER TABLE employee ADD COLUMN chief_id INT;
ALTER TABLE employee ADD CONSTRAINT fk_emp_chief
    FOREIGN KEY (chief_company_id, chief_id)
    REFERENCES employee(company_id, id) ON DELETE SET NULL;

CREATE TABLE skills (
    company_id INT NOT NULL,
    employee_id INT NOT NULL,
    skill_name TEXT NOT NULL,
    PRIMARY KEY (company_id, employee_id, skill_name),
    CONSTRAINT fk_skills_comp_emp
     FOREIGN KEY (company_id, employee_id)
        REFERENCES employee(company_id, id)
);



CREATE TABLE "authorization" (
    company_id INT NOT NULL,
    employee_id INT NOT NULL,
    factory_id INT NOT NULL,
    production_line_id INT NOT NULL,
    PRIMARY KEY (company_id, employee_id, factory_id, production_line_id),
    CONSTRAINT fk_auth_comp_emp_fact_prod_line
       FOREIGN KEY (company_id, employee_id) REFERENCES employee(company_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_auth_comp_fact_prod_line
     FOREIGN KEY (company_id, factory_id, production_line_id) REFERENCES production_line(company_id, factory_id, id) ON DELETE CASCADE
);

CREATE TABLE intervention (
    id INT PRIMARY KEY,
    company_id INT NOT NULL,
    employee_id INT NOT NULL,
    factory_id INT NOT NULL,
    production_line_id INT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_int_comp_emp
      FOREIGN KEY (company_id, employee_id) REFERENCES employee(company_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_int_comp_fact_prod_line
      FOREIGN KEY (company_id, factory_id, production_line_id) REFERENCES production_line(company_id, factory_id, id) ON DELETE CASCADE
);

CREATE TABLE parameters (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    value TEXT 
);

-- -----------------------------
-- TRIGGER FUNCTIONS
-- -----------------------------

CREATE OR REPLACE FUNCTION increment_activity_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE employee
    SET activity_points = activity_points + 10
    WHERE company_id = NEW.company_id
      AND id = NEW.employee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_points
AFTER INSERT ON intervention
FOR EACH ROW
EXECUTE FUNCTION increment_activity_points();

CREATE OR REPLACE FUNCTION check_authorization_before_intervention()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "authorization"
        WHERE company_id = NEW.company_id
          AND employee_id = NEW.employee_id
          AND factory_id = NEW.factory_id
          AND production_line_id = NEW.production_line_id
    ) THEN
        RAISE EXCEPTION 'Employee % not authorized on line % in company %',
            NEW.employee_id, NEW.production_line_id, NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_authorization
BEFORE INSERT ON intervention
FOR EACH ROW
EXECUTE FUNCTION check_authorization_before_intervention();

-- -----------------------------
-- COMMENTS
-- -----------------------------

-- Tables
COMMENT ON TABLE company IS 'Represents a company, the top-level entity in the industrial model.';
COMMENT ON TABLE factory IS 'A factory owned by a company.';
COMMENT ON TABLE production_line IS 'A line in a factory producing products.';
COMMENT ON TABLE product IS 'A manufactured product.';
COMMENT ON TABLE line_product IS 'Mapping of lines to products.';
COMMENT ON TABLE employee IS 'Employee working in a factory.';
COMMENT ON TABLE "authorization" IS 'Authorization of employee per production line.';
COMMENT ON TABLE intervention IS 'Interventions performed by employees.';
COMMENT ON TABLE parameters IS 'Generic app parameters.';

-- Columns
COMMENT ON COLUMN employee.activity_points IS 'Points earned for interventions.';
COMMENT ON COLUMN employee.works_with_id IS 'Employee this one collaborates with.';
COMMENT ON COLUMN employee.chief_id IS 'Supervisor of this employee.';
COMMENT ON COLUMN intervention.date IS 'When intervention occurred.';
COMMENT ON COLUMN factory.company_id IS 'Owning company of the factory.';
COMMENT ON column "authorization".employee_id IS 'Authorized employee.';
COMMENT ON column "authorization".production_line_id IS 'Authorized line.';
COMMENT ON COLUMN line_product.production_line_id IS 'Line making product.';
COMMENT ON COLUMN line_product.product_id IS 'Product made.';

-- Trigger functions
COMMENT ON FUNCTION increment_activity_points() IS 'Increments employee activity points after an intervention.';
COMMENT ON FUNCTION check_authorization_before_intervention() IS 'Validates authorization before intervention.';

-- Triggers
COMMENT ON TRIGGER trg_increment_points ON intervention IS 'Adds activity points after intervention.';
COMMENT ON TRIGGER trg_check_authorization ON intervention IS 'Checks employee authorization.';

-- FK Comments
COMMENT ON CONSTRAINT fk_emp_works_with ON employee IS 'Reflexive FK: employee works with another.';
COMMENT ON CONSTRAINT fk_emp_chief ON employee IS 'Reflexive FK: employee''s chief.';

-- PK Comment
COMMENT ON CONSTRAINT employee_pkey ON employee IS 'Composite PK on (company_id, id).';
