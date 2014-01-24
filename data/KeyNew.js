self.port.on("show", function (arg) {
    var textArea = document.getElementById('edit-box');
    textArea.focus();
    // When the user hits return, send a message to main.js.
    // The message payload is the contents of the edit box.
    textArea.onkeyup = function(event) {
        if (event.keyCode == 13) {
            // Remove the newline.
            var text = textArea.value.replace(/(\r\n|\n|\r)/gm,"");
            self.port.emit("text-entered", text);
            textArea.value = '';
        }
    };
});