import { evaluationController } from "../simulation/evaluation-ts.ts";
import * as Messages from "./messages.ts";
import { simulationController } from "../simulation/simulation-ts.ts";

// Query tool strings
const densityStrings = ["Low", "Medium", "High", "Very High"];
const landValueStrings = ["Slum", "Lower Class", "Middle Class", "High"];
const crimeStrings = ["Safe", "Light", "Moderate", "Dangerous"];
const pollutionStrings = ["None", "Moderate", "Heavy", "Very Heavy"];
const rateStrings = ["Declining", "Stable", "Slow Growth", "Fast Growth"];
const zoneTypes = [
  "Clear",
  "Water",
  "Trees",
  "Rubble",
  "Flood",
  "Radioactive Waste",
  "Fire",
  "Road",
  "Power",
  "Rail",
  "Residential",
  "Commercial",
  "Industrial",
  "Seaport",
  "Airport",
  "Coal Power",
  "Fire Department",
  "Police Department",
  "Stadium",
  "Nuclear Power",
  "Draw Bridge",
  "Radar Dish",
  "Fountain",
  "Industrial",
  "Steelers 38  Bears 3",
  "Draw Bridge",
  "Ur 238",
];

// Evaluation window
const gameLevel = {};
gameLevel["" + simulationController.LEVEL_EASY] = "Easy";
gameLevel["" + simulationController.LEVEL_MED] = "Medium";
gameLevel["" + simulationController.LEVEL_HARD] = "Hard";

const cityClass = {};
cityClass[evaluationController.CC_VILLAGE.value] = "VILLAGE";
cityClass[evaluationController.CC_TOWN.value] = "TOWN";
cityClass[evaluationController.CC_CITY.value] = "CITY";
cityClass[evaluationController.CC_CAPITAL.value] = "CAPITAL";
cityClass[evaluationController.CC_METROPOLIS.value] = "METROPOLIS";
cityClass[evaluationController.CC_MEGALOPOLIS.value] = "MEGALOPOLIS";

const problems = {};
problems[evaluationController.CRIME.value] = "Crime";
problems[evaluationController.POLLUTION.value] = "Pollution";
problems[evaluationController.HOUSING.value] = "Housing";
problems[evaluationController.TAXES.value] = "Taxes";
problems[evaluationController.TRAFFIC.value] = "Traffic";
problems[evaluationController.UNEMPLOYMENT.value] = "Unemployment";
problems[evaluationController.FIRE.value] = "Fire";

// months
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Tool strings
const toolMessages = {
  noMoney: "Insufficient funds to build that",
  needsDoze: "Area must be bulldozed first",
};

// Message strings
const neutralMessages = {};
neutralMessages[Messages.FIRE_STATION_NEEDS_FUNDING] = true;
neutralMessages[Messages.NEED_AIRPORT] = true;
neutralMessages[Messages.NEED_FIRE_STATION] = true;
neutralMessages[Messages.NEED_ELECTRICITY] = true;
neutralMessages[Messages.NEED_MORE_INDUSTRIAL] = true;
neutralMessages[Messages.NEED_MORE_COMMERCIAL] = true;
neutralMessages[Messages.NEED_MORE_RESIDENTIAL] = true;
neutralMessages[Messages.NEED_MORE_RAILS] = true;
neutralMessages[Messages.NEED_MORE_ROADS] = true;
neutralMessages[Messages.NEED_POLICE_STATION] = true;
neutralMessages[Messages.NEED_SEAPORT] = true;
neutralMessages[Messages.NEED_STADIUM] = true;
neutralMessages[Messages.ROAD_NEEDS_FUNDING] = true;
neutralMessages[Messages.POLICE_NEEDS_FUNDING] = true;
neutralMessages[Messages.WELCOME] = true;

const badMessages = {};
badMessages[Messages.BLACKOUTS_REPORTED] = true;
badMessages[Messages.EARTHQUAKE] = true;
badMessages[Messages.EXPLOSION_REPORTED] = true;
badMessages[Messages.FLOODING_REPORTED] = true;
badMessages[Messages.FIRE_REPORTED] = true;
badMessages[Messages.HEAVY_TRAFFIC] = true;
badMessages[Messages.HELICOPTER_CRASHED] = true;
badMessages[Messages.HIGH_CRIME] = true;
badMessages[Messages.HIGH_POLLUTION] = true;
badMessages[Messages.MONSTER_SIGHTED] = true;
badMessages[Messages.NO_MONEY] = true;
badMessages[Messages.NOT_ENOUGH_POWER] = true;
badMessages[Messages.NUCLEAR_MELTDOWN] = true;
badMessages[Messages.PLANE_CRASHED] = true;
badMessages[Messages.SHIP_CRASHED] = true;
badMessages[Messages.TAX_TOO_HIGH] = true;
badMessages[Messages.TORNADO_SIGHTED] = true;
badMessages[Messages.TRAFFIC_JAMS] = true;
badMessages[Messages.TRAIN_CRASHED] = true;

const goodMessages = {};
goodMessages[Messages.REACHED_CAPITAL] = true;
goodMessages[Messages.REACHED_CITY] = true;
goodMessages[Messages.REACHED_MEGALOPOLIS] = true;
goodMessages[Messages.REACHED_METROPOLIS] = true;
goodMessages[Messages.REACHED_TOWN] = true;

const messageText = {};
messageText[Messages.FIRE_STATION_NEEDS_FUNDING] = "Fire departments need funding";
messageText[Messages.NEED_AIRPORT] = "Commerce requires an Airport";
messageText[Messages.NEED_FIRE_STATION] = "Citizens demand a Fire Department";
messageText[Messages.NEED_ELECTRICITY] = "Build a Power Plant";
messageText[Messages.NEED_MORE_INDUSTRIAL] = "More industrial zones needed";
messageText[Messages.NEED_MORE_COMMERCIAL] = "More commercial zones needed";
messageText[Messages.NEED_MORE_RESIDENTIAL] = "More residential zones needed";
messageText[Messages.NEED_MORE_RAILS] = "Inadequate rail system";
messageText[Messages.NEED_MORE_ROADS] = "More roads required";
messageText[Messages.NEED_POLICE_STATION] = "Citizens demand a Police Department";
messageText[Messages.NEED_SEAPORT] = "Industry requires a Sea Port";
messageText[Messages.NEED_STADIUM] = "Residents demand a Stadium";
messageText[Messages.ROAD_NEEDS_FUNDING] = "Roads deteriorating, due to lack of funds";
messageText[Messages.POLICE_NEEDS_FUNDING] = "Police departments need funding";
messageText[Messages.WELCOME] = "Welcome to WebCity";
messageText[Messages.BLACKOUTS_REPORTED] = "Brownouts, build another Power Plant";
messageText[Messages.EARTHQUAKE] = "Major earthquake reported !!";
messageText[Messages.EXPLOSION_REPORTED] = "Explosion detected ";
messageText[Messages.FLOODING_REPORTED] = "Flooding reported !";
messageText[Messages.FIRE_REPORTED] = "Fire reported ";
messageText[Messages.HEAVY_TRAFFIC] = "Heavy Traffic reported";
messageText[Messages.HELICOPTER_CRASHED] = "A helicopter crashed ";
messageText[Messages.HIGH_CRIME] = "Crime very high";
messageText[Messages.HIGH_POLLUTION] = "Pollution very high";
messageText[Messages.MONSTER_SIGHTED] = "A Monster has been sighted !";
messageText[Messages.NO_MONEY] = "YOUR CITY HAS GONE BROKE";
messageText[Messages.NOT_ENOUGH_POWER] = "Blackouts reported: insufficient power capacity";
messageText[Messages.NUCLEAR_MELTDOWN] = "A Nuclear Meltdown has occurred !!";
messageText[Messages.PLANE_CRASHED] = "A plane has crashed ";
messageText[Messages.SHIP_CRASHED] = "Shipwreck reported ";
messageText[Messages.TAX_TOO_HIGH] = "Citizens upset. The tax rate is too high";
messageText[Messages.TORNADO_SIGHTED] = "Tornado reported !";
messageText[Messages.TRAFFIC_JAMS] = "Frequent traffic jams reported";
messageText[Messages.TRAIN_CRASHED] = "A train crashed ";
messageText[Messages.REACHED_CAPITAL] = "Population has reached 50,000";
messageText[Messages.REACHED_CITY] = "Population has reached 10,000";
messageText[Messages.REACHED_MEGALOPOLIS] = "Population has reached 500,000";
messageText[Messages.REACHED_METROPOLIS] = "Population has reached 100,000";
messageText[Messages.REACHED_TOWN] = "Population has reached 2,000";

export const textUtils = {
  badMessages: badMessages,
  cityClass: cityClass,
  crimeStrings: crimeStrings,
  densityStrings: densityStrings,
  gameLevel: gameLevel,
  goodMessages: goodMessages,
  landValueStrings: landValueStrings,
  messageText: messageText,
  months: months,
  neutralMessages: neutralMessages,
  problems: problems,
  pollutionStrings: pollutionStrings,
  rateStrings: rateStrings,
  toolMessages: toolMessages,
  zoneTypes: zoneTypes,
};