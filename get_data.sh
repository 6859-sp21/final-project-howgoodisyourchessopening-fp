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
                "lichess_db_standard_rated_2012-07" 
                "lichess_db_standard_rated_2012-01" 
                "lichess_db_standard_rated_2011-07" 
                "lichess_db_standard_rated_2011-01" 
                "lichess_db_standard_rated_2010-07" 
                "lichess_db_standard_rated_2010-01" 
            )

for filename in "${arr[@]}"
do
    echo "Processing $filename"
    wget https://database.lichess.org/standard/$filename.pgn.bz2
    bzip2 -d $filename.pgn.bz2
    python3 preprocess.py $filename
    echo "Removing $filename.pgn"
    rm $filename.pgn
done
