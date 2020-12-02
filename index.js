const ipc = require('electron').ipcRenderer;
const dialog = require('electron').remote.dialog;
const fs = require("fs");

// Classes for elements in app
class AppInterface {
    constructor() {
        this.quoteZone = new QuoteZone(this);
        this.closeButton = new CloseButton(this);
        this.openButton = new OpenButton(this);
        this.settingHolder = new SettingHolder(this);
        this.helpButton = document.getElementById("help");
        this.inHelp = false;
        this.helptext = "App can load quote txt files where each quote is separated by 2 line breaks (i.e. single blank line between)\nPress ? to close help\nPress up/down arrows to move to prev/next notification";
        this.helpButton.addEventListener("click", () => {
            if (this.inHelp) {
                this.quoteZone.currElement.innerText = "";
                this.inHelp = false;
                if (this.quoteZone.nonEmptyNoteList()) {
                    this.quoteZone.currElement.innerText = this.quoteZone.noteList[this.quoteZone.currQuote];
                    this.quoteZone.resetScrollTimer();
                }
            } else {
                this.quoteZone.currElement.innerText = this.helptext;
                this.inHelp = true
                if (this.quoteZone.nonEmptyNoteList()) {
                    this.quoteZone.stopScrollTimer();
                }
            }
        });
        this.prevButton = document.getElementById("prev");
        this.prevButton.addEventListener("click", () => {
            if (this.quoteZone.nonEmptyNoteList()) {
                this.quoteZone.prevQuote();
                this.quoteZone.resetScrollTimer();
            }
        });
        this.nextButton = document.getElementById("next")
        this.nextButton.addEventListener("click", () => {
            if (this.quoteZone.nonEmptyNoteList()) {
                this.quoteZone.nextQuote();
                this.quoteZone.resetScrollTimer();
            }
        });
    }
}

class CloseButton {
    constructor(appInterface) {
        this.appInterface = appInterface;
        this.closeButtonElement = document.getElementById("close");
        this.closeButtonElement.addEventListener("click", () => {
            // Send quit message
            ipc.send("close");
        });
    }
}

class OpenButton {
    constructor(appInterface) {
        this.appInterface = appInterface;
        this.filePath = null;
        this.openButtonElement = document.getElementById("open");
        this.openButtonElement.addEventListener("click", () => {
            let filePath = dialog.showOpenDialogSync({
                properties: ['openFile']
            })[0];
            this.appInterface.inHelp = false;
            this.appInterface.quoteZone.noteList = fileToNote(fs.readFileSync(filePath).toString());
            this.appInterface.quoteZone.resetScroll();
        });
    }
}

class QuoteZone {
    constructor(appInterface) {
        this.appInterface = appInterface;
        this.noteList = null;
        this.scrollTimer = null;
        this.currQuote = 0;
        this.quoteZoneElement = document.getElementById("quote-zone");
        this.currElement = document.getElementById("curr");
    }

    nextQuote() { //TODO: transition animation for this and the thing after it
        this.currQuote++;
        if (this.currQuote == this.noteList.length) {
            this.currQuote = 0;
        }
        this.currElement.innerText = this.noteList[this.currQuote];
    }

    prevQuote() {
        this.currQuote--;
        if (this.currQuote == -1) {
            this.currQuote = this.noteList.length-1;
        }
        this.currElement.innerText = this.noteList[this.currQuote];
    }

    resetScroll() {
        clearInterval(this.scrollTimer);
        this.currElement.innerText = "";
        this.currQuote = 0;
        if (this.nonEmptyNoteList()) {
            this.currQuote = this.noteList.length-1; // so we start off at next
            this.nextQuote();
            this.resetScrollTimer();
        }
    }

    stopScrollTimer() {
        clearInterval(this.scrollTimer);
    }

    startScrollTimer() {
        this.scrollTimer = setInterval(() => {
            this.nextQuote();
        }, this.appInterface.settingHolder.scrollInterval);
    }

    resetScrollTimer() {
        this.stopScrollTimer();
        this.startScrollTimer();
    }

    nonEmptyNoteList() {
        if (this.noteList !== null) {
            return this.noteList.length > 0;
        }
        return 0;
    }
}

class SettingHolder {
    constructor(appInterface) {
        this.appInterface = appInterface;
        this.scrollInterval = 5000; // in ms
    }
}

// Useful functions

// Converting to and from txt format
// Current format is for each notification there is a divide of /n/n
// File format is simply txt, so just a string
// in app note list format is a list of strings

function fileToNote(fileStr) {
    return fileStr.split(/[/\r?\n/]{2}/).filter(
        function(value, index, arr) {
            return value != "";
        }
    );
}

// Run initialisation
const appInterface = new AppInterface();