ok retirer les classes fk_detailed et fk_synth du survol hover
ok idem pour showLabel voir PLAPLAPLA

mettre les précédents dans un booleen en cas de débug

- OK: faire passer les entrées de  menu 1FK et per col en toggle . 

NOK ajouter la classe nullable sur les colonnes en hover. 

OK Mettre aussi la destination dans les colonnes en hover
detailedLabel: `${e.constraint_name}\n(${e.source_column}->${e.target_column})`, //PLA ne marche pas;
il y a bien target_column dans le retour de requête

NOK prise en compte du AND dans les select de edge