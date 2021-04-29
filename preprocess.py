import re
import sys

bsz = 50000
max_games = 1000000
print("Getting %d games from %d.pgn" % (max_games, sys.argv[1]))
pgn_path = '/mnt/e/a4-howgoodisyourchessopening/' + sys.argv[1] + '.pgn'
write_path = '/mnt/e/a4-howgoodisyourchessopening/' + sys.argv[1] + '-cleaned.csv'
# pgn_path = '/mnt/e/lichess-open-dataset/lichess_db_standard_rated_2021-02.pgn'
# write_path = '/mnt/e/a4-howgoodisyourchessopening/2021-02-cleaned_{}.csv'.format(max_games)
n_moves = 4

with open(pgn_path, 'r') as f, open(write_path, 'w') as g:
    n_games = 0
    games = []
    elements = []
    g.write('Date\tResult\tWhiteElo\tBlackElo\tOpening\tMoves\n')
    for line in f:
        if line.startswith('[Date') or line.startswith('[Result') or line.startswith('[WhiteElo') or line.startswith('[BlackElo') or line.startswith('[Opening'):
            elem = re.search('"(.+?)"', line).group(1)
            elements.append(elem)
        if line.startswith('1.'):
            regex = "([\{].*?[\}])|([0-9]+\.\.\.\ )|\?|\!|1-0|0-1|1\/2-1\/2"
            cleaned = re.sub(regex, "", line)
            cleaned = re.sub("\ \ ", " ", cleaned)
            cleaned = ' '.join(cleaned.strip().split()[:n_moves*3])
            elements.append(cleaned)
            games.append("\t".join(elements))
            elements = []
            if len(games) == bsz:
                g.write('\n'.join(games) + '\n')
                n_games += len(games)
                print("Wrote %d games" % n_games)
                games = []
            if n_games >= max_games:
                break

