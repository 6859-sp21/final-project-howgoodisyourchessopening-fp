#!/bin/sh

declare -a arr=("lichess_db_standard_rated_2021-01"
                # 2020
                "lichess_db_standard_rated_2020-10"
                "lichess_db_standard_rated_2020-09"
                "lichess_db_standard_rated_2020-08"
                "lichess_db_standard_rated_2020-07"
                "lichess_db_standard_rated_2020-06"
                "lichess_db_standard_rated_2020-05"
                "lichess_db_standard_rated_2020-04"
                "lichess_db_standard_rated_2020-03"
                "lichess_db_standard_rated_2020-02"
                "lichess_db_standard_rated_2020-01"
                # 2019
                "lichess_db_standard_rated_2019-12"
                "lichess_db_standard_rated_2019-11"
                "lichess_db_standard_rated_2019-10"
                "lichess_db_standard_rated_2019-09"
                "lichess_db_standard_rated_2019-08"
                "lichess_db_standard_rated_2019-07"
                "lichess_db_standard_rated_2019-06"
                "lichess_db_standard_rated_2019-05"
                "lichess_db_standard_rated_2019-04"
                "lichess_db_standard_rated_2019-03"
                "lichess_db_standard_rated_2019-02"
                "lichess_db_standard_rated_2019-01"
                # 2018
                "lichess_db_standard_rated_2018-07"
                "lichess_db_standard_rated_2018-01"
                # 2017
                "lichess_db_standard_rated_2017-07"
                "lichess_db_standard_rated_2017-01"
                # 2016
                "lichess_db_standard_rated_2016-12"
                "lichess_db_standard_rated_2016-11"
                "lichess_db_standard_rated_2016-10"
                "lichess_db_standard_rated_2016-09"
                "lichess_db_standard_rated_2016-08"
                "lichess_db_standard_rated_2016-07"
                "lichess_db_standard_rated_2016-06"
                "lichess_db_standard_rated_2016-05"
                "lichess_db_standard_rated_2016-04"
                "lichess_db_standard_rated_2016-03"
                "lichess_db_standard_rated_2016-02"
                "lichess_db_standard_rated_2016-01"
                # 2015
                "lichess_db_standard_rated_2015-07"
                "lichess_db_standard_rated_2015-01"
                # 2014
                "lichess_db_standard_rated_2014-07"
                "lichess_db_standard_rated_2014-01"
                # 2013
                "lichess_db_standard_rated_2013-07"
                "lichess_db_standard_rated_2013-01"
            )

for filename in "${arr[@]}"
do
    echo "Subsampling $filename"
    head -n 1000 ./datafiles/${filename}-cleaned.csv > ./datafiles/${filename}-cleaned-small.csv
done
