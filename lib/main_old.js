//CLASSES

var Tabs=require("sdk/tabs");
var URL=require("sdk/url").URL;
var self=require("sdk/self");
var Store=require("sdk/simple-storage");
var Timers=require("sdk/timers");
var Panel=require("sdk/panel");
var Loader = require("sdk/loader");
//TOOLBAR VARS
var {Cc, Ci} = require('chrome');

var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

//NAMES

const _extID='VKEncrypter';
const _toolButtonName='VK Encrypter';
var _toolButtonID='ext:' + self.id + '-' + _extID + 'b';
var _menuButtonID='ext:' + self.id + '-' + _extID + 'm';

//GLOBAL VARS
var _data=self.data;
var _btn,_extPanel,_msgPanel,_setKeyPanel; //toolbar button, extension panel, msgPanel
var _current_state=0; //0 - not tracking, 1 - tracking

var timer_id,time_handler,temp_val;

var _script_im_worker=null;
var _script_im_state=0;

//LOCAL VARS

var current_tab=Tabs.activeTab;
var lc_storage=Store.storage;
var conversation_object=new Object();
// FUNCTION BLOCK (CREATE PANELS)


function CreateSetKeyWindow(){
    var panel=Panel.Panel({
        contentURL: _data.url("KeyNew.html"),
        contentScriptFile: _data.url("KeyNew.js")
    });
    panel.port.on("text-entered", function () {
        panel.hide();
    });
    panel.on("show", function() {
        panel.port.emit("show");
    });
    return panel;
}

//FUNCTION BLOCK (SERVICE)

function SetExtensionState(state){
    //console.log("Function Call: SetExtensionState");
    _current_state=state;
    var path="";
    if(state!=0){
        //set widget icon below
        path=_data.url('favicon_a.ico');
    }
    else{
        path=_data.url('favicon_i.ico');
    }
    if(_btn) _btn.setAttribute('image', path);
}

function AddToolbarButton() {
    // this document is an XUL document
    var document;
    try{
        document= mediator.getMostRecentWindow('navigator:browser').document;
    }catch(e){
        return 0;
    }


    var navBar = document.getElementById('nav-bar');
    if (!navBar) {
        return 0;
    }
    _btn = document.createElement('toolbarbutton');
    _btn.setAttribute('id', _toolButtonID);
    _btn.setAttribute('type', 'button');
    // the toolbarbutton-1 class makes it look like a traditional button
    _btn.setAttribute('class', 'toolbarbutton-1');
    // the data.url is relative to the data folder
    _btn.setAttribute('image', _data.url('favicon_i.ico'));

    // this text will be shown when the toolbar is set to text or text and icons
    _btn.setAttribute('label', _toolButtonName);
    _btn.setAttribute('style', "width: 32px");
    //_btn.setAttribute('height', '32px');
    _btn.setAttribute('orient', 'horizontal');
    _btn.addEventListener('click', function() {
        // do stuff, for example with tabs or pageMod
    }, false)
    navBar.appendChild(_btn);
    return 1;
}

function RemoveToolbarButton() {
    // this document is an XUL document
    var document;
    if(mediator.getMostRecentWindow('navigator:browser')!=null)
        document= mediator.getMostRecentWindow('navigator:browser').document;
    else return 0;
    var navBar = document.getElementById('nav-bar');

    if (navBar && _btn) {
        navBar.removeChild(_btn);
        return 1;
    }
    return 0;
}

//TRACKING BLOCK
function Reset() {
    try{
        //console.log("Function call: Reset()");
        //_script_worker=null;
        _current_state=0;
        _script_im_state=0;
        if(_script_im_worker!=null){
            _script_im_worker.port.emit("convEnd");
        }
        if(timer_id!=null){
            Timers.clearInterval(timer_id);
            timer_id=null;
        }
        return 1;
    }catch(e){
        return 0;
    }
    //alert("Reset was sent!");
}

function SetPrimaryTrackers(tab){
    //console.log("Function call: SetPrimaryTrackers()");
    if(tab){
        current_tab=tab;
        tab.on('load',Reset);
        tab.on('deactivate',StopTracking); //needs recoding
        tab.on('close',StopTracking);
        tab.on('pageshow',PageStaticShow);
        //tab.on('ready',PageStaticLoad);
    }

}
function UnsetPrimaryTrackers(tab){
    //console.log("Function call: UnsetPrimaryTrackers()");
    if(tab){
     // tab.removeListener('ready',IsTabVKDomain);
      tab.removeListener('deactivate',StopTracking);
      tab.removeListener('close',StopTracking);
      tab.removeListener('pageshow',PageStaticShow);
      tab.removeListener('load',Reset);
      //tab.removeListener('ready',PageStaticLoad);
    }
}


function StopTracking(){
    //console.log("Function call: StopTracking()");
    SetExtensionState(0);
    //remove all listeners from an old tab
    UnsetPrimaryTrackers(current_tab);
    Reset();
    current_tab=null;
}

function IsMatches(url,regexp){
    //console.log("Function call: IsMatches()");
    var matched=url.match(regexp);
    if(matched&&matched[0]==url)
        return 1;
    else return 0;
}
function WaitForCommunication(handler){
    //console.log("Function call: WaitForCommunication()");
     if(current_tab){
        if(timer_id==null){
            time_handler=handler;
            //console.log("CYCLE STAAAAAAAAAAAAAAART");
            timer_id=Timers.setInterval(function() {
                if(IsMatches(current_tab.url,/.*vk.com\/im?.*sel=.{1,}/)==1){
                    Timers.clearInterval(timer_id);
                    timer_id=null;
                    time_handler();
                    //console.log("CYCLE ENDEEEED");

                }
                //console.log("CYCLE ITERATION");
            },500);
            return 1;
        }
     }
    return 0;
}
function WaitForURLChange(handler,regexp){
    //console.log("Function call: WaitForURLChange()");
    if(current_tab){
        if(timer_id==null){
            time_handler=handler;
            //console.log("CYCLE2 STAAAAAAAAAAAAAAART");
            temp_val=regexp;
            timer_id=Timers.setInterval(function() {
                if(IsMatches(current_tab.url,temp_val)==0){
                    Timers.clearInterval(timer_id);
                    timer_id=null;
                    //console.log("CYCLE2 ENDEEEED");
                    time_handler();
                }
                //console.log("CYCLE2 ITERATION");
            },500);
            return 1;
        }
    }
    return 0;
}
function CheckTabURL(tab){
    //0 - not vk domain
    //1 - vk domain random page
    //2 - vk domain dialogs page
    //---------------------
    //3 - vk domain im page (!)


    //console.log("Function call: CheckTabURL");
    if(!tab.url||!tab) return 0;

    //convert URI to URL class
    var tab_url=URL(tab.url);
    const target_host="vk.com";
    const target_im_r=/.*vk.com\/im.*/; //reg exp
    const target_sel_r=/.*vk.com\/im?.*sel=.{1,}/;

    if(tab_url.hostname==target_host){ //ok, so now - vk.com page (random,im,im+sel)
        if(IsMatches(tab.url,target_im_r)){ //ok, so now - vk im page or im+sel page
            if(IsMatches(tab.url,target_sel_r)){
                //msg="DIALOG PAGE";
                SetExtensionState(3);
            }
            else{
                //msg="DIALOGS MENU PAGE";
                SetExtensionState(2);
            }
        }
        else{
           // msg="RANDOM VK PAGE";
            SetExtensionState(1);
        }
        return 1;
    }
    else {
        SetExtensionState(0);
        return 0;
    }
}
function IndexOfKey(id){
    var keys=lc_storage.keys;
    for(var tot=keys.length,i=0;i<tot;i++)
      if(keys[i].id==id) return i;
    return -1;
}
function PrepareConvObj(){
    //console.log("Function call: PrepareConvObj()");

    conversation_object.id=current_tab.url.substring(current_tab.url.indexOf('sel=')+4);
    var idx=IndexOfKey(conversation_object.id);
    conversation_object.key=(idx!=-1)?lc_storage.keys[idx].key:null;
    if(idx==-1){
        //display warning, and offer user to set the key for this id
        _setKeyPanel.show();
        _setKeyPanel.port.on("text-entered",function(text){
            lc_storage.keys.push({id:conversation_object.id,key:text});
            //send new conv object
            conversation_object.key=text;
            try{
                _script_im_worker.port.emit("convChange",conversation_object);
            }catch(e){
                //console.log("Something happened when function sent data to worker: "+_script_im_worker);
            }
            //console.log("DONE DONE DONE!!!!");
        });
    }
}
function ConvChange(){
   //console.log("Function call: ConvStart()");
   PrepareConvObj();
   _script_im_worker.port.emit("convChange",conversation_object);
    WaitForURLChange(function(){
        if(CheckTabURL(current_tab)){
            if(_current_state!=3)
                WaitForCommunication(ConvStart);
            else
                ConvChange();
        }
    },new RegExp(".*vk.com\/im?.*sel="+conversation_object.id));
}
function ConvStart(){
    //get all information
    //console.log("Function call: ConvStart()");
    PrepareConvObj();

    console.log("Starting conversation: id="+conversation_object.id+' key='+conversation_object.key);
    if(_script_im_state==0||_script_im_worker==null){
        _script_im_worker=current_tab.attach({
           // contentScript: 'alert("STARTING WTF SUPPA MAGIC");',
            contentScriptFile: [self.data.url("jquery.js"),
                                self.data.url("encrypter.js")]
        });
        _script_im_state=1;
        _current_state=3;
    }
    _script_im_worker.port.emit("convStart",conversation_object);
    _script_im_worker.port.on("convDestroy",function(){
        _script_im_state=0;
        _script_im_worker.destroy();
        console.log("Script destroyed");

    });
    //now set for a change
    WaitForURLChange(function(){
        if(CheckTabURL(current_tab)){
            if(_current_state!=3)
                WaitForCommunication(ConvStart);
            else
                ConvChange();
        }
    },new RegExp(".*vk.com\/im?.*sel="+conversation_object.id));
}
function PageStaticLoad(tab){
    if(CheckTabURL(tab)){

        if(_current_state!=3) {
            WaitForCommunication(ConvStart);
            //_script_worker.port.on("waitEnd",ConvStart);
        }
        //then start another war
        else ConvStart();
    }
}
function PageStaticShow(tab){
    if(_current_state==0||_script_im_worker==null){
        if(CheckTabURL(tab)){

            if(_current_state!=3) {
                WaitForCommunication(ConvStart);
                //_script_worker.port.on("waitEnd",ConvStart);
            }
            //then start another war
            else ConvStart();
        }
    }
}
function CheckAndTrack(tab){
    //console.log("Function call: CheckAndTrack()");
    SetPrimaryTrackers(tab);
    if(tab&&tab.url){

        PageStaticLoad(tab);
    }

}
//MAIN PART
//on extension deactivate

exports.onUnload = function(reason) {
    console.log(">>UNLOADING STARTED!");
    //first - remove button
    RemoveToolbarButton();
    //second - remove trackers
    console.log(">>unloading...>>removed icon...");
    UnsetPrimaryTrackers(current_tab);
    console.log(">>unloading...>>removed trackers from the active tab...");
    Reset();
    console.log(">>unloading...>>removed timers and workers");
    Tabs.removeListener('activate',CheckAndTrack);
    console.log(">>unloading...>>removed trackers from tabs...");
    Store=null;

    console.log(">>UNLOADING FINISHED");
};
//on extension activate
exports.main = function(options, callbacks) {
    //first - add toolbar button

    AddToolbarButton();
    //CREATE PANELS
    _setKeyPanel=CreateSetKeyWindow();

    //second - initialize storage
    if(!lc_storage.keys)
        lc_storage.keys=[];
    //third - initialize trackings
    current_tab=Tabs.activeTab;
    if(current_tab) SetPrimaryTrackers(current_tab);
     Tabs.on('activate',CheckAndTrack);
    console.log(">>VK ENCRYPTER IS LOADED. Thank you for using this plug-in for Mozilla Firefox");
};

