import pandas as pd

num_openings_per_year = 10

for year in range(2013, 2021, 1):
    fn_jan = "~/final-project-howgoodisyourchessopening-fp/datafiles/lichess_db_standard_rated_" + str(year) + "-01-cleaned.csv"
    fn_jul = "~/final-project-howgoodisyourchessopening-fp/datafiles/lichess_db_standard_rated_" + str(year) + "-07-cleaned.csv"
    
    df_jan = pd.read_csv(fn_jan, delimiter='\t')
    df_jul = pd.read_csv(fn_jul, delimiter='\t')
    df = pd.concat((df_jan, df_jul))

    opening_freq = df['Opening'].str.split(':').str[0].value_counts().reset_index()
    opening_freq.columns = ['name', 'value']
    opening_freq['parent'] = 'Origin'
    opening_freq.loc[len(opening_freq)] = ['Origin', None, None]
    print()
    print(year)
    print(opening_freq)
    write_fn = "~/final-project-howgoodisyourchessopening-fp/datafiles/" + str(year) + "-openings.csv"
    print("Writing to %s" % write_fn)
    opening_freq.head(num_openings_per_year).to_csv(write_fn, index=False)

