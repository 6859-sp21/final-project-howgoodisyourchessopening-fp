#!/bin/sh

declare -a arr=("lichess_db_standard_rated_2021-01" 
                "lichess_db_standard_rated_2020-07" 
                "lichess_db_standard_rated_2020-01" 
                "lichess_db_standard_rated_2019-07" 
                "lichess_db_standard_rated_2019-01" 
                "lichess_db_standard_rated_2018-07" 
                "lichess_db_standard_rated_2018-01" 
                "lichess_db_standard_rated_2017-07" 
                "lichess_db_standard_rated_2017-01" 
                "lichess_db_standard_rated_2016-07" 
                "lichess_db_standard_rated_2016-01" 
                "lichess_db_standard_rated_2015-07" 
                "lichess_db_standard_rated_2015-01" 
                "lichess_db_standard_rated_2014-07" 
                "lichess_db_standard_rated_2014-01" 
                "lichess_db_standard_rated_2013-07" 
                "lichess_db_standard_rated_2013-01" 
            )

for filename in "${arr[@]}"
do
    echo "Subsampling $filename"
    head -n 10000 ./datafiles/${filename}-cleaned.csv > ./datafiles_small/${filename}-cleaned-small.csv
done
