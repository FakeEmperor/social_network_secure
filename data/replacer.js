/**
 * Created with JetBrains PhpStorm.
 * User: Alish
 * Date: 21.10.13
 * Time: 2:42
 * To change this template use File | Settings | File Templates.
 */
//BY THE WAY - THIS SCRIPT NEEDS JQUERY

var script_state=0;

//MAIN BLOCK
/*function ContentChanged(event){
    self.port.emit("ContentChanged",event.data.msg);
    switch(script_state){
        case 1:{
            var $im_button=$("#l_msg");
            $im_button.unbind('click',ContentChanged);
        }break;
    }
    alert("CHAnGed PAGE!!! State "+event.data.msg);
}

function DOMEventHandler(event){
    console.log("CHANGED DOM NODE!!");
}

function StartSniffing(state){
    var $im_button=$("#l_msg");
    switch(state){
        case 0:{
            alert('Script now is inactive');
            return 0;
        }break;
        case 1:{ //random vk page

            $im_button.bind('click',{msg:2},ContentChanged);
        }break;
        case 2:{ //dialogs page
            //ok, maybe DOMChange will help you?
            var $content_holder=$("#im_rows");
            $content_holder.bind('DOMNodeInserted',DOMEventHandler);

            $im_button.on('click',{msg:2},ContentChanged);
        }break;
        case 3:{ //conversation page

        }break;
        default:{
            alert('"State" value is undefined, script is inactive');
            return 0;
        }break;
        //$body.html("WATAFAAAK");
    }
    alert('Script now is active with the state '+state.toString());
    script_state=state;
    Dispatch(1);

    return 1;
}

function Dispatch(state){
    self.port.emit("scriptState",state);
}

self.port.on("sniffContent",StartSniffing);

*/


var interval_id=null;

function WaitForURL(){
    self.port.emit("waitStart");
    console.log("CYCLE STAAAAAAAAAAAAAAART");

    interval_id=setInterval(function() {
            self.port.emit("waitIteration");
            console.log("CYCLE ITERATION");
        },500);
    self.port.on("waitEnd",function (){
        clearInterval(interval_id);
        self.port.emit("waitEnd");
        console.log("CYCLE ENDEEEEEEEEEEEEEEEEEEEEEEEED");
    });
}
self.port.on("waitForURL",WaitForURL);