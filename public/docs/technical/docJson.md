### foreign keys sample

``` json

"foreignKeys": [
                    {
                        "constraint_name": "line_product_company_id_factory_id_production_line_id_fkey",
                        "source_table": "line_product",
                        "target_table": "production_line",
                        "comment": null,
                        "column_mappings": [
                            {
                                "source_column": "company_id",
                                "source_not_null": true,
                                "target_column": "company_id"
                            },
                            {
                                "source_column": "factory_id",
                                "source_not_null": true,
                                "target_column": "factory_id"
                            },
                            {
                                "source_column": "production_line_id",
                                "source_not_null": true,
                                "target_column": "id"
                            }
                        ],
                        "all_source_not_null": true,
                        "is_target_unique": true,
                        "on_delete": "c",
                        "on_update": "a"
                    },
```

Qu'on retrouve dans les edges : 
``` json
    {
            "data": {
                "source": "line_product",
                "target": "production_line",
                "label": "line_product_company_id_factory_id_production_line_id_fkey",
                "columnsLabel": "company_id --> company_id",
                "onDelete": "c",
                "onUpdate": "a",
                "nullable": false
            },
            "classes": "fk_detailed delete_cascade"
        },
        {
            "data": {
                "source": "line_product",
                "target": "production_line",
                "label": "line_product_company_id_factory_id_production_line_id_fkey",
                "columnsLabel": "factory_id --> factory_id",
                "onDelete": "c",
                "onUpdate": "a",
                "nullable": false
            },
            "classes": "fk_detailed delete_cascade"
        },
        {
            "data": {
                "source": "line_product",
                "target": "production_line",
                "label": "line_product_company_id_factory_id_production_line_id_fkey",
                "columnsLabel": "production_line_id --> id",
                "onDelete": "c",
                "onUpdate": "a",
                "nullable": false
            },
            "classes": "fk_detailed delete_cascade"
        },

```   
