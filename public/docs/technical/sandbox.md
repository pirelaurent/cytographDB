
## employee

| Name | Type | Nullable |
| --- | --- | --- |
| company_id | integer | NO |
| id | integer | NO |
| first_name | character varying(20) | NO |
| name | character varying(20) | NO |
| factory_id | integer | NO |
| activity_points | integer | NO |
| works_with_company_id | integer | YES |
| works_with_id | integer | YES |
| chief_company_id | integer | YES |
| chief_id | integer | YES |



## list of FK from democytodb


## list of FK from democytodb

| Source | Target | ●/○ |  FK |
| --- | --- | --- | --- |
| authorization | production_line | ●|  authorization_company_id_factory_id_production_line_id_fkey  |
|company_id ->   | company_id | ● | |
|factory_id ->   | factory_id  |  ● | | 
|company_id ->  | company_id| ● ||
|factory_id ->   | factory_id  |  ● | | 