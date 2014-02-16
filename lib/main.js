/** CLASSES **/

const Tabs=require("sdk/tabs");
const URL=require("sdk/url").URL;
const self=require("sdk/self");
const Store=require("sdk/simple-storage");
const Timers=require("sdk/timers");
const Panel=require("sdk/panel");
const File=require("sdk/io/file");
var Loader = require("toolkit/loader"); //internal loader (system)


/** Getting Chrome authority and all priveleged classes **/
const {Cc,Ci,Cu,components} = require("chrome");

const tracker_module = require("gui"),
      gui_module = require("tracker"); //internal modules

var iDOMParser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser); //DOMParser class instance



/**
 * @fullname - self.fullName
 * @shortname - self.name
 * @version - self.version
**/

/**
 * MAIN MODULE
 * @about - this module is the main plugin's module.
 * @desc - it loads up all necessary userdata (*.ini, *.xml files), modules, and sets up interface between them.
 * Each module has access to this module, and all userdata is passed, if necessary, to the module via main module.
 * File i/o is also processed via this module. To save compatability with Linux, MacOS and Windows it is necessary to do that.
 * Each module can also call Main Module's API functions via open port between this and given modules. It can also pass some data and events.
 * Open ports are also used to pass some user data or events.
 * For each module rights are specified. They are used to define, what API functions of the Main module the given module can call.
 * Each module also can obtain list of events by sending "getEvents" requests.
**/

/*****  CUSTOM CLASSES   *****/

/**
 * Events class. An array of all possible events.
 * @type {{SecurityError: {name: string, id: number}, IOError: {name: string, id: number}, Error: {name: string, id: number}}}
 *
**/
var Events = {
    SecurityError:{name:"SecurityError",id:0x0A},
    IOError:{name:"IOError",id:0x0B},
    Error:{name:"CustomError",id:0x00}
}

/** NEEDS TO BE MOVED TO UTILS.JS FILE!!
 *  API Function class
 *
**/
var APIFunction = {
    rightsMask:0, //0 - no rights.
    function:null,
    functionName:"",
    call:function (module,args){
        if(module.right&this.rightsMask==this.rightsMask)
            return this.function(args);
        else
            throw Events.SecurityError;
    }
};

/**** FILE I/O FUNCTIONS ****/

function saveLocalFile(fileName){

}
function loadLocalFile(fileName){

}

function loadPluginFile(path){
    var res = self.data.load(path);
    if(typeof res === "undefined") {
        throw Events.IOError;
    }
    else return res;
}


/** MAIN FUNCTION **/
/** NEEDED CONSTANTS **/
const init_filepath = "init.xml";

/** NEEDED VARIABLES **/

var init_xml_obj = {};
var modules = [];


function main(){
    var mods_total = 0,
        mods_success = 0;
    console.log("Initializing plugin(name: "+self.name+"id: "+self.id+" )"+"...");
    /** Initialization plan
     *  1) load ini file
     *  2) parse ini file
     *  3) for each module entry...
     *      3.1) load module file
     *      3.2) load module data
     *  4) for each loaded module
     *      4.1) send M_INIT message with module data and ports to the necessary modules
     *      4.2) send M_START message, that means plug-in initialization is ended.
    **/
    var init_xml = null;
    console.log("Loading initialization file...");
    try {
        init_xml = loadPluginFile(init_filepath);
    } catch(e){
        console.log("File FAIL. Plug-in initialization failed. Main .ini file not found.");
        return -1;
    }
    console.log("File OK. Parsing file...");
    try{
        init_xml = iDOMParser.parseFromString(init_xml,"text/xml");
        /**  Init XML Structure
         * 1) <global> - root node
         *               @attributes version=<number> stability=<char>
         * 1.1) <modules> node - a list with all nodes
         * 1.1.1) <module> node - module's description with
         *                        @attributes id - module's id, name - module's full name, version - module's version.
         * 1.1.1.1) [<path>] node - module's filepath.
         * 1.1.1.2) [<data>] node - module's data filepath.
         * 1.1.1.3) [<ports>] node - a list of all needed ports.
         * 1.1.1.3.1) <port> node - port that will be used to exchange data between modules.
         *                          @attributes type={"both","in","out"}, and value - needed module id.
         * 1.1.1.4) <order> node - module's load order.
        **/
        var root_node = init_xml.firstChild;
        var modules_node = init_xml.getElementsByTagName("modules")[0];
        var module_list = modules_node.getElementsByTagName("module");
        /** Fill in version and stability state**/
        init_xml_obj.version = root_node.getAttribute("version");
        init_xml_obj.stability = root_node.getAttribute("stability");

        console.log("Parsing .ini file: plug-in version="+init_xml_obj.version+init_xml_obj.stability);

        /** Fill in all module's information for each module
         *  1) module's id
         *  2) module's full name
         *  3) module's file path
         *  4) module's data file path
         *  5) module's loading order
         *  6) module's ports
         *      6.1) port's destination id
         *      6.2) port's type
        **/

        init_xml_obj.modules = [];
        for(let i=0; i<module_list.length; i++){
            var obj = {status:0}; //module descriptor

            obj.id = module_list[i].getAttribute("id"); //module's id
            obj.name = module_list[i].getAttribute("name"); //module's full name

            obj.order = parseInt(module_list[i].getElementsByTagName("order").item(0).textContent); //module's loading order
            if(isNaN(obj.order))
                throw Events.Error;

            obj.path = module_list[i].getElementsByTagName("path"); //module's file path
            if(typeof obj.path !== "undefined" && obj.path.length!=0) obj.path = obj.path.item(0).textContent;
            else obj.path = null;

            /** Ports **/
            obj.ports = [];
            var ports = module_list[i].getElementsByTagName("ports");
            if(typeof ports!== "undefined" && ports.length!=0){
                ports = ports.item(0).getElementsByTagName("port");

                for(let u=0; u<ports.length; u++){
                    let p = {};
                    p.id = ports[u].textContent;
                    p.type = ports[u].getAttribute("type");
                    p.type = (p.type=="both")?3:(p.type=="in")?2:(p.type=="out")?1:-1;
                    if(p.type == -1)
                        throw Events.Error;
                    obj.ports[u]= p;
                }
            }


            obj.data = module_list[i].getElementsByTagName("data"); //module's additional data file path
            if(typeof obj.data !== "undefined" && obj.data.length!=0) obj.data = obj.data.item(0).textContent;
            else obj.data = null;

            init_xml_obj.modules.push(obj);
            console.log("Parsing .ini file: parsing module "+(i+1)+"/"+module_list.length+" ("+obj.id+")    OK");
        }
    } catch(e) {
        console.log("Parsing .ini file FAIL. Main .ini file is corrupted. Event data: "+e);
        return -2;
    }
    // sort by order

    mods_total = init_xml_obj.modules.length;
    console.log("Parsing initialization file OK.");
    console.log("Loading modules...");
    for(let i=0; i<mods_total; i++){
        console.log("Loading module "+(i+1)+"/"+mods_total+" ("+init_xml_obj.modules[i].id+")...");
        try{

        }catch(e){
            console.log("Initialization module FAIL. Event data:"+e);
            return -3;
        }
    }
    console.log("Loading modules OK.");

    console.log("Starting plug-in's Graphical User Interface module...");
    try{
        //gui_module.start();
        console.log("Plug-in's GUI module OK.");
    }catch(e){
        console.log("Starting plug-in's Graphical User Interface module FAIL. Event data: "+e);
        return -4;

    }

    console.log("Starting internal page tracking...");
    try{
        tracker_module.main({},null);
        console.log("Plug-in's internal Page Tracking module OK.");
    }catch(e){
        console.log("Starting plug-in's internal Page Tracking module FAIL. Event data: "+e);
        return -5;

    }



    console.log("Starting modules...");

    console.log("Starting modules OK.");

    console.log("Plug-in initialization ended successfully. Modules up: "+mods_success+"/"+mods_total);
    return 0;
}
function unload(){
    console.log("Unloading plugin( name: "+self.name+"id: "+self.id+" )...");

    console.log("Plug-in deinitialization ended. Modules are down.")
}

exports.onUnload = function (reason){
    console.log("Plug-in is unloading, because of following reason: "+reason+". Calling unload() function...");
    unload();
    console.log("Plug-in is unloaded.");
};
exports.main = function (options, callback){
    var code;
    console.log("Plug-in is starting, because of following reason: "+options.loadReason+". Calling main() function...");
    if((code = main())!=0) {
        console.log("Plug-in startup process is broken. Auto-disabling plug-in...");
        //alert("Plug-in startup process failed. Error code: "+code + ". Plug-in will be disabled in a moment.");
        exports.onUnload("disable");
    }
    else console.log("Plug-in started.");
};


/** MAIN CALLBACK FUNCTION **/

