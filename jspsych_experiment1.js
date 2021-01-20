/*
Script for first experimental session
uncomment console.logs for debugging
If no data are stored, unable redirect to questionnaires.html to see php errors
*/

// path to testfile.json
let dataPath = "testfiles/testfile.json";

// run experiment on button click
document.querySelector('#start').addEventListener(
    'click',
    () => {
        runExperiment(dataPath);
    });

// function to run experiment with specified json file
function runExperiment(dataPath) {
    //console.log(sessionStorage.getItem('prolific_id'));

    // get participant ID from local storage
    let prolific_id = sessionStorage.getItem('prolific_id');
    
    // AJAX get request
    let xhr = new XMLHttpRequest();
    xhr.open('GET', dataPath, true);
    xhr.onload = function() {

        // load and parse JSON
        let trialObj = JSON.parse(this.responseText);
        //console.log(trialObj);
        
        // object to array
        let trialList = Object.values(trialObj);
        //console.log(trialList);

        // TESTING: only use first 5 trials
        trialList = trialList.slice(0, 5);
        //console.log(trialList);

        // create jsPsych timeline
        let trialTimeline = createTimeline(trialList);
        //console.log(trialTimeline);

        // run 2 forced choice task
        run2FC(trialTimeline);

    }
    xhr.send();

};

function createTimeline(trialArray) {
    // input array: immOpt, delOpt, delay
    // output jsPsych-Timeline: html stimuli

    // initialize timeline
    const trialTimeline = [];

    // add trials to timeline: loop through trialList
    trialArray.map(trial => {
        let trialData = {
            post_trial_gap: 300,
            stimulus:
            `<div class = centerbox id='container'>
            <p class = center-block-text>
                Please select the option that you would prefer pressing
                <strong>'q'</strong> for left
                <strong>'p'</strong> for right:
            </p>
            <div class='table'>
            <div class='row'>
            <div class = 'option' id='leftOption'><center><font color='green'>
                ${trial.immOpt}
            <br>
                Today
            </font></center></div>
            <div class = 'option' id='rightOption'><center><font color='green'>
                ${trial.delOpt}
            <br>
                in ${trial.delay} days
            </font></center></div></div></div></div>`,

            data: {
                immOpt: trial.immOpt,
                delOpt: trial.delOpt,
                delay: trial.delay
            }//,
            // on_finish: function(data) {
            //     if(data.key_press == 80){
            //         document.getElementById('rightOption').style.border = "thick solid  #008000";
            //       } else if(data.key_press == 81){
            //         document.getElementById('leftOption').style.border = "thick solid  #008000";
            //       }
            // }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};

function run2FC(trialTimeline) {
    // input: jsPsych timeline (array)
    const timeline = [];

    let testBlock = {
        type: "html-keyboard-response",
        timeline: trialTimeline,
        choices: ['q', 'p'],
        stimulus_duration: 4000,
        trial_duration: 4000,
        on_finish: function(data) {
            delete data.stimulus; // not needed in csv data

            // recode button press for csv
            if(data.key_press == 80){
            data.choice = "delayed";
          } else if(data.key_press == 81){
            data.choice = "immediate";
          }
        }
    }
    // add block to timeline
    timeline.push(testBlock);

    // execute
    jsPsych.init({
        timeline: timeline,
       // ad minimum RT to prevent reflex clicks
        minimum_valid_rt: 300, 
        // save data after experiment is finished
        on_finish: function() {
            // save data
            saveData(jsPsych.data.get().csv());
            // debugging: display data
            //jsPsych.data.displayData('json');
        },
        // save remaining data if experiment is cancelled
        on_close: function(){
            saveData(jsPsych.data.get().csv());
        }
    });
};

function saveData(data) {
    // creates object with prolific id and experiment data
    // sends json-object to php for storage
    let params = {
        "prolific_id": sessionStorage.getItem('prolific_id'),
        "data": data
    };    
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'web_API/saveExp1.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function(){
        //console.log(this.responseText);
        // redirect to next page upon success
        window.location.assign('questionnaires.html');
    };

    xhr.send(JSON.stringify(params));
};