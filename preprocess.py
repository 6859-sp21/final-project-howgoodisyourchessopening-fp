import re
import sys

bsz = 50000
max_games = 100000
print("Getting %d games from %s.pgn" % (max_games, sys.argv[1]))
pgn_path = sys.argv[1] + '.pgn'
write_path = './datafiles/' + sys.argv[1] + '-cleaned.csv'
n_moves = 4

with open(pgn_path, 'r') as f, open(write_path, 'w') as g:
    n_games = 0
    games = []
    elements = []
    g.write('Date\tResult\tWhiteElo\tBlackElo\tOpening\tMoves\n')
    elements = {}
    for line in f:
        if line.startswith('[Date') or line.startswith('[UTCDate'):
            elem = re.search('"(.+?)"', line).group(1)
            elements['Date'] = elem
        elif line.startswith('[Result'):
            elem = re.search('"(.+?)"', line).group(1)
            elements['Result'] = elem
        elif line.startswith('[WhiteElo'):
            elem = re.search('"(.+?)"', line).group(1)
            elements['WhiteElo'] = elem
        elif line.startswith('[BlackElo'):
            elem = re.search('"(.+?)"', line).group(1)
            elements['BlackElo'] = elem
        elif line.startswith('[Opening'):
            elem = re.search('"(.+?)"', line).group(1)
            elements['Opening'] = elem
        elif line.startswith('1.'):
            regex = "([\{].*?[\}])|([0-9]+\.\.\.\ )|\?|\!|1-0|0-1|1\/2-1\/2"
            cleaned = re.sub(regex, "", line)
            cleaned = re.sub("\ \ ", " ", cleaned)
            cleaned = ' '.join(cleaned.strip().split()[:n_moves*3])
            elements['Moves'] = cleaned
            games.append("\t".join([elements['Date'], elements['Result'], elements['WhiteElo'], elements['BlackElo'], elements['Opening'], elements['Moves']]))
            elements = {}
            if len(games) == bsz:
                g.write('\n'.join(games) + '\n')
                n_games += len(games)
                print("Wrote %d games" % n_games)
                games = []
            if n_games >= max_games:
                break

