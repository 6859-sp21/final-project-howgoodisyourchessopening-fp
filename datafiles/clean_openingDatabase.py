import pandas as pd
data = pd.read_csv("openingDatabase.tsv", sep="\t")
digits = "0123456789"
seen = set()
indices_to_take = []
for index, row in data.iterrows():
    name = row['Name']
    if name in seen:
        continue
    else:
        seen.add(name)
        indices_to_take.append(index)
    s = row['Opening Moves']
    s_clean = ""
    for i in range(len(s)):
        s_clean += s[i]
        if i == 0 or (i < len(s)-1 and s[i-1] == " " and s[i+1] == " " and s[i] in digits):
            s_clean += "."
    data.loc[index]['Opening Moves'] = s_clean
    if data.loc[index]['Name'] in ['Sicilian', 'English']:
        data.loc[index]['Name'] += ' Opening'
    if data.loc[index]['Name'] in ['Scandinavian']:
        data.loc[index]['Name'] += ' Defense'
    if data.loc[index]['Name'] in ['Robatsch']:
        data.loc[index]['Name'] = 'Modern Defense'

indices_to_take.append(len(data))
data.loc[len(data)] = {'ECO Code': 'XX', 'Name': 'Italian Game', 'Opening Moves': '1.e4 e5 2.Nf3 Nc6 3.Bc4'}
data.iloc[indices_to_take].to_csv("openingDatabaseClean.tsv", sep='\t')
