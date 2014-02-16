const Tabs=require("sdk/tabs");
const URL=require("sdk/url").URL;
const self = require("sdk/self");

var _status = 0; //0 - unloaded, 1 - initialized, 2 - working.
var _options = { dynamic:1, static:1, domains:[] };
var _currentTab;
var _currentWindow;

function TrackStatic(){

}
function TrackDynamic(){

}

exports.main = function (options, callback){
    console.log("Initializing Internal Tracker...");
    _status = 1;
    _options = (typeof options !== "undefined" && options != null)?options:_options;
    console.log("Initialization finished successfully!");
};

exports.start = function (options) {

};

exports.switch = function (type) {

};

exports.checkTab = function (tab){

};