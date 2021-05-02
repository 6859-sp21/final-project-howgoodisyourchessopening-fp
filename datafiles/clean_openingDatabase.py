import pandas as pd
data = pd.read_csv("openingDatabase.tsv", sep="\t")
digits = "0123456789"
for index, row in data.iterrows():
    s = row['Opening Moves']
    s_clean = ""
    for i in range(len(s)):
        s_clean += s[i]
        if i == 0 or (i < len(s)-1 and s[i-1] == " " and s[i+1] == " " and s[i] in digits):
            s_clean += "."
    data.loc[index]['Opening Moves'] = s_clean
data.to_csv("openingDatabaseClean.tsv", sep='\t')
