import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# -------- Top scorers --------
player_df = pd.read_csv(
    DATA_DIR / "gold_player_summary.csv",
    sep=";",
    decimal=",",
    engine="python"
)

numeric_cols = ["avg_pts", "avg_ast", "avg_trb"]
for col in numeric_cols:
    player_df[col] = pd.to_numeric(player_df[col], errors="coerce")

player_df = player_df.dropna(subset=numeric_cols)

player_json = (
    player_df
    .sort_values("avg_pts", ascending=False)
    .head(10)
    .rename(columns={
        "avg_pts": "avg_season_pts",
        "avg_ast": "avg_season_ast",
        "avg_trb": "avg_season_trb"
    })
    [["player", "avg_season_pts", "avg_season_ast", "avg_season_trb"]]
)

player_json.to_json(
    DATA_DIR / "gold_player_summary.json",
    orient="records",
    indent=2
)

# -------- Advanced stats --------
adv_df = pd.read_csv(
    DATA_DIR / "gold_player_adv_summary.csv",
    sep=";",
    decimal=",",
    engine="python"
)

numeric_cols = ["total_triple_doubles", "total_double_doubles"]
for col in numeric_cols:
    adv_df[col] = pd.to_numeric(adv_df[col], errors="coerce")

adv_df = adv_df.dropna(subset=numeric_cols)

adv_json = (
    adv_df
    .sort_values("total_triple_doubles", ascending=False)
    .head(10)
    [["player", "total_triple_doubles", "total_double_doubles"]]
)

adv_json.to_json(
    DATA_DIR / "gold_player_adv.json",
    orient="records",
    indent=2
)
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# Load the team summary CSV
team_df = pd.read_csv(DATA_DIR / "gold_team_summary.csv", sep=";", decimal=",", engine="python")

# Convert numeric columns
numeric_cols = ["avg_pts", "avg_ast", "avg_trb", "total_games", "distinct_players"]
for col in numeric_cols:
    team_df[col] = pd.to_numeric(team_df[col], errors="coerce")

team_df = team_df.dropna(subset=numeric_cols)

# -------------------------------
# 1️⃣ League-wide stats per season
# -------------------------------
league_df = team_df.groupby("season_year")[["avg_pts","avg_ast","avg_trb"]].mean().reset_index()
league_df.to_json(DATA_DIR / "league_avg_stats.json", orient="records", indent=2)
print("League JSON created.")

# -------------------------------
# 2️⃣ Selected teams over time
# -------------------------------
# Pick the teams you want to show
teams_to_show = ["LAL", "BOS","GSW","OKC","MIL","HOU","CHI","ATL","PHI","NYK","DET"]  # Lakers & Celtics
team_filtered_df = team_df[team_df["tm"].isin(teams_to_show)]

team_filtered_df = team_filtered_df.sort_values(["tm","season_year"])
team_filtered_df.to_json(DATA_DIR / "team_stats.json", orient="records", indent=2)
print("Team JSON created.")
print("JSON files created successfully.")
