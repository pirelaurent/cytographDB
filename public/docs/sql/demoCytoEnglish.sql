

-- to be run with: psql -U postgres -f ./public/docs/sql/demoCytoEnglish.sql

-- Create the database
CREATE DATABASE demoCytoEnglish;

-- Connect to the new database
\connect demoCytoEnglish


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

-- AUTHORIZATIONS: which production lines each employee is authorized to work on
CREATE TABLE authorization (
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
        FROM authorization
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
