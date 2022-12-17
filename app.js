let express = require("express");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let path = require("path");
let app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

let initializeDBAndServer = async function () {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, function () {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

let convertPlayerDbIntoResponseDb = function (dbObject) {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

let convertMatchDetailsDbObjectToResponseObject = function (dbObject) {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Returns a list of all the players in the player table
app.get("/players/", async function (request, response) {
  let getPlayerQuery = `
        SELECT 
            *
        FROM
            player_details
    `;
  let playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map(function (eachPlayer) {
      return convertPlayerDbIntoResponseDb(eachPlayer);
    })
  );
});

//Returns a specific player based on the player ID
app.get("/players/:playerId/", async function (request, response) {
  let { playerId } = request.params;
  let getPlayersByIdQuery = `
            SELECT
                *
            FROM 
                player_details
            WHERE
                player_id = ${playerId};
    `;
  let playerIdArray = await db.get(getPlayersByIdQuery);
  response.send(convertPlayerDbIntoResponseDb(playerIdArray));
});

//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async function (request, response) {
  let { playerId } = request.params;
  let { playerName } = request.body;
  let putPlayerQuery = `
        UPDATE
            player_details
        SET
            player_name= '${playerName}'
        WHERE
            player_id= ${playerId};
        
    `;
  let array = await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async function (request, response) {
  let { matchId } = request.params;
  let getMatchIdQuery = `
            SELECT
                *
            FROM
                match_details
            WHERE
                match_id = ${matchId};
    `;
  let matchArray = await db.get(getMatchIdQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(matchArray));
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async function (request, response) {
  let { playerId } = request.params;
  let getPlayersMatchQuery = `
                SELECT 
                    *
                FROM
                    player_match_score
                NATURAL JOIN
                    match_details
                WHERE 
                    player_id = ${playerId};
        `;
  let playerMatchArrays = await db.all(getPlayersMatchQuery);
  response.send(
    playerMatchArrays.map(function (eachMatch) {
      return convertMatchDetailsDbObjectToResponseObject(eachMatch);
    })
  );
});

//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async function (request, response) {
  let { matchId } = request.params;
  let getMatchesQuery = `
        SELECT 
            *
        FROM 
            player_match_score
        NATURAL JOIN 
            player_details
        WHERE 
            match_id = ${matchId};
    `;
  let array = await db.all(getMatchesQuery);
  response.send(
    array.map(function (eachPlayer) {
      return convertPlayerDbIntoResponseDb(eachPlayer);
    })
  );
});

app.get("/players/:playerId/playerScores/", async function (request, response) {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});
module.exports = app;
