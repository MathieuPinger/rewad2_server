/*
Script for first experimental session
uncomment console.logs for debugging
If no data are stored, unable redirect to questionnaires.html to see php errors
*/

// redirect to index if no Prolific ID is stored
//console.log(sessionStorage.getItem('prolific_id'));
window.onload = function() {
    if(sessionStorage.getItem('prolific_id') === null) {
        window.location.assign('index.html');
    } else {
        findFile(sessionStorage.getItem('prolific_id'));
    }
};

// path to testfile.json
let dataPath = "testfiles/testfile.json";

// run experiment on page load
document.addEventListener(
    'DOMContentLoaded',
    () => {
        runExperiment(dataPath);
});


function runExperiment(dataPath) {
    /*
    RUN EXPERIMENT
    - loads json trial
    - converts json data to an array of trial objects
    - calls run2FC (2-forced-choice) function with the trial array
    */

    //console.log(dataPath);
    //console.log(sessionStorage.getItem('prolific_id'));
    
    
    // AJAX get request
    let xhr = new XMLHttpRequest();
    xhr.open('GET', dataPath, true);
    xhr.onload = function() {

        // load and parse JSON
        let trialObj = JSON.parse(this.responseText);
        console.log(trialObj);
        
        // object to array
        let trialList = Object.values(trialObj);
        console.log(trialList);

        // round trial Options to 2 digits
        trialList.forEach(trial => {
            if(trial['task'] == "loss") {
                trial['immOpt'] = -trial['immOpt'];
                trial['delOpt'] = -trial['delOpt'];
            };
            trial['immOpt'] = parseFloat(trial['immOpt']).toFixed(2);
            trial['delOpt'] = parseFloat(trial['delOpt']).toFixed(2);
        });

        // TESTING: only use first 5 trials
        // trialList = trialList.slice(0, 5);
        // console.log(trialList);

        // create jsPsych timeline
        let trialTimeline = createTimeline(trialList);
        console.log(trialTimeline);
        
        // run 2 forced choice task
        run2FC(trialTimeline);

    }
    xhr.send();

};

function createTimeline(trialArray) {
    /*
    input: array of Objects with immOpt, delOpt, delay
    output: jsPsych-Timeline with html stimuli
    */
    const trialTimeline = [];

    // add trials to timeline: loop through trialList
    trialArray.map(trial => {
        // create random number: 0 or 1
        // rando == 0 -> immediate left; rando == 1 -> immediate right
        trial.rando = Math.round(Math.random());

        let trialData = {
            // 
            stimulus: constructStim(trial.rando, trial.immOpt, trial.delOpt, trial.delay),

            data: {
                immOpt: trial.immOpt,
                delOpt: trial.delOpt,
                delay: trial.delay,
                task: trial.task,
                randomize: trial.rando
            }
        }
        trialTimeline.push(trialData);
        });
    return trialTimeline;
};

function run2FC(trialTimeline) {
    // input: jsPsych timeline (array)
    let timeline = [];
    /* 
    INSTRUCTIONS AND TEST TRIALS
    - verbal instructions
    - one test trial per condition: loss and reward
    -> total timeline: [instructions, testProcedure, trialProcedure]
    */
    let instructionsText =
        `<p><b>Welcome to the experiment!</b></p>
        <p>Please read these instructions carefully.
        The experimental procedure will be demonstrated after you have read the instructions.</p>
        <p>In each trial of the experiment, you will see two amounts of money to choose from, 
        one <b>smaller value</b> and one <b>larger value</b>
        which will be displayed randomly on the left and right side, respectively. 
        Each option will be associated with a <b>time</b> when you can receive the money,
        which will be <b>immediately</b> for the smaller value or in <b>the future</b> for the larger value.
        Your task is to choose between these options.</p>

        <p>In some of the trials, you will choose between two <b>wins</b>, 
        in some, you will choose between two <b>losses</b> 
        (indicated by negative amounts of money). Each trial stands on its own, 
        please treat every decision independently.</p>

        <p>All choices are <b>imaginary</b>, i.e. <b>your reimbursement 
        for this experiment will not depend on your decisions</b>.
        However, please choose between the options 
        <b>as if the choices were real</b>. There is no correct or false answer. 
        Please select the option that you would prefer as if the money 
        was paid out to you in the corresponding timeframe.</p>

        <p>For each trial, you will have <b>5 seconds</b>
        to decide between the two options.<br>
        Please press <b>Q to select the option on the left</b> and 
        <b>P to select the option on the right.</b>
        Your choice will be hightlighted in green.</p>

        
        <p>Before the experiment starts, there will be <b>6 test trials</b> with no time limit. 
        The experiment will last approximately <b>45 minutes</b>. Halfway through the experiment, you will 
        be asked to fill out a number of questionnaires before moving on to the second half. 
        You will be free to take a break before moving on to the second half, if needed.</p>`

    let instructions = {
        type: "html-button-response",
        stimulus: instructionsText,
        choices: ['Continue to test trials'],
        margin_vertical: '100px',
    };

    let testingProcedure = {

        timeline: [
            testingBlock = {
                type: "html-keyboard-response",
                stimulus: jsPsych.timelineVariable('stimulus'),
                data: jsPsych.timelineVariable('data'),
                choices: ['q', 'p'],
                on_finish: function(data) {
                    // add timelineType
                    data.timelineType = "test";
                }
            },
            testingFeedback = {
                type: 'html-keyboard-response',
                stimulus: function(){
                    lastChoice = jsPsych.data.getLastTrialData().values()[0].key_press;
                    lastRando = jsPsych.data.getLastTrialData().values()[0].randomize;
                    lastImmOpt = jsPsych.data.getLastTrialData().values()[0].immOpt;
                    lastDelOpt = jsPsych.data.getLastTrialData().values()[0].delOpt;
                    lastDelay = jsPsych.data.getLastTrialData().values()[0].delay;

                    if(lastChoice == 81){
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay,
                            feedback='left');
                        return trialFeedback

                    } else if(lastChoice == 80) {
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay,
                            feedback='right');
                        return trialFeedback

                    } else {
                        trialFeedback = `<div class = centerbox id='container'>
                        <p class = center-block-text style="color:red;">
                            Please select an option by pressing Q or P!
                        </p>`;
                        return trialFeedback
                    }
                },
                choices: jsPsych.NO_KEYS,
                trial_duration: 1000,
                on_finish: function(data) {
                    // add timelineType
                    data.timelineType = "feedback"; 
                }
            },
            fixation = {
                type: 'html-keyboard-response',
                stimulus: '<div style="font-size:60px;">+</div>',
                choices: jsPsych.NO_KEYS,
                // jitter fixcross between 500 and 1500 ms
                trial_duration:  Math.random() * (1500-500)+500
              },
        ],
        timeline_variables: [
            {   data: {immOpt: '5.00', delOpt: '10.20', delay: '7', randomize: '0'},
                stimulus: constructStim('0', '5.00', '10.20', '7') },
            {   data: {immOpt: '4.00', delOpt: '6.80', delay: '20', randomize: '1'},
                stimulus: constructStim('1', '4.00', '6.80', '20') },
            {   data: {immOpt: '3.00', delOpt: '3.40', delay: '10', randomize: '1'},
                stimulus: constructStim('1', '3.00', '3.40', '10') },
            {   data: {immOpt: '-5.00', delOpt: '-10.20', delay: '7', randomize: '0'},
                stimulus: constructStim('0', '-5.00', '-10.20', '7') },
            {   data: {immOpt: '-10.00', delOpt: '-15.50', delay: '50', randomize: '1'},
                stimulus: constructStim('1', '-10.00', '-15.50', '50') },
            { data: {immOpt: '-4.00', delOpt: '-6.80', delay: '20', randomize: '0'},
                stimulus: constructStim('0', '-4.00', '-6.80', '20') }
        ],
        randomize_order: true
    };

    let finishInstructions = {
        type: "html-keyboard-response",
        stimulus: 
            `<p>From now on, you have <b>5 seconds</b> for each decision.</p>
            <p>After ca. 20 minutes you will be asked to fill out a number of questionnaires.</p>
            <p>Please place your left index finger on Q, and your right index finger on P.</p>
            <p>Then press Q or P to continue to the experiment.</p>`,
        choices: ['q', 'p'],
        margin_vertical: '100px',
    };


    // console.log("This is the trialTimeline:");
    // console.log(trialTimeline);
    let trialProcedure = {
        timeline: [
            testBlock = {
                type: "html-keyboard-response",
                stimulus: jsPsych.timelineVariable('stimulus'),
                data: jsPsych.timelineVariable('data'),
                choices: ['q', 'p'],
                stimulus_duration: 5000,
                trial_duration: 5000,
                on_finish: function(data) {
                    delete data.stimulus; // not needed in csv
                    // recode button press for csv
                    if(data.key_press == 80 && data.randomize == 0){
                    data.choice = "delayed";
                    } else if(data.key_press == 81 && data.randomize == 0){
                    data.choice = "immediate";
                    } else if(data.key_press == 81 && data.randomize == 1){
                    data.choice = "delayed";
                    } else if(data.key_press == 80 && data.randomize == 1){
                    data.choice = "immediate";
                    };
                    // add timelineType
                    data.timelineType = "trial";
                }
            },
            feedback = {
                type: 'html-keyboard-response',
                stimulus: function(){
                    lastChoice = jsPsych.data.getLastTrialData().values()[0].key_press;
                    lastRando = jsPsych.data.getLastTrialData().values()[0].randomize;
                    lastImmOpt = jsPsych.data.getLastTrialData().values()[0].immOpt;
                    lastDelOpt = jsPsych.data.getLastTrialData().values()[0].delOpt;
                    lastDelay = jsPsych.data.getLastTrialData().values()[0].delay;

                    if(lastChoice == 81){
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay,
                            feedback='left');
                        return trialFeedback

                    } else if(lastChoice == 80) {
                        trialFeedback = constructStim(lastRando, lastImmOpt, lastDelOpt, lastDelay,
                            feedback='right');
                        return trialFeedback

                    } else {
                        trialFeedback = `<div class = centerbox id='container'>
                        <p class = center-block-text style="color:red;">
                            Please select an option by pressing Q or P!
                        </p>`;
                        return trialFeedback
                    }
                },
                choices: jsPsych.NO_KEYS,
                trial_duration: 1000,
                on_finish: function(data) {
                    // add timelineType
                    data.timelineType = "feedback"; 
                }
            },
            fixation = {
                type: 'html-keyboard-response',
                stimulus: '<div style="font-size:60px;">+</div>',
                choices: jsPsych.NO_KEYS,
                // jitter fixcross between 500 and 1500 ms
                trial_duration:  Math.random() * (1500-500)+500
              },
        ],
        timeline_variables: trialTimeline,
        randomize_order: true
    };
    timeline.push(instructions, testingProcedure, finishInstructions, trialProcedure);

    jsPsych.init({
        timeline: timeline,
        minimum_valid_rt: 200,
        on_finish: function() {
            // save only trial data, not feedback
            let dataToSave = jsPsych.data.get().filter({timelineType: "trial"}).csv();
            saveData(dataToSave);
            //jsPsych.data.displayData('json');
        },
        on_close: function(){
            let dataToSave = jsPsych.data.get().filter({timelineType: "trial"}).csv();
            saveData(dataToSave);
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
        window.location.assign('questionnaires.html');
    };

    xhr.send(JSON.stringify(params));
};

// constructor function for html stimulus
let feedbackStyle = 'style="border: thick solid  #008000;"';

function constructStim(rando, immOpt, delOpt, delay, feedback) {
    // rando = randomize left/right presentation
    // if rando == 0 -> immediate left, else right

    // initialize styles for feedback and options
    let feedbackStyle = 'style="border: thick solid  #008000;"';
    let immOptColor = '#005AB5';
    let delOptColor = '#DC3220';

    let stimString = `<div class = centerbox id='container'>
    <p class = center-block-text>
        Please select the option that you would prefer pressing
        <strong>'q'</strong> for left
        <strong>'p'</strong> for right:
    </p>
    <div class='table'>
    <div class='row'>
    <div class = 'option' id='leftOption' ${feedback=='left' ? feedbackStyle : null}>
        <center><font color=${rando==0 ? immOptColor : delOptColor}>
        ${rando==0 ? immOpt : delOpt} €
        <br>
        ${rando==0 ? 'Today' : `in ${delay} days`}
        </font></center></div>
    <div class = 'option' id='rightOption' ${feedback=='right' ? feedbackStyle : null}>
        <center><font color=${rando==0 ? delOptColor : immOptColor}>
        ${rando==0 ? delOpt : immOpt} €
        <br>
        ${rando==0 ? `in ${delay} days` : 'Today'}
        </font></center></div></div></div></div>`;
        return stimString;
};

// function to check session ID and redirect if necessary
function findFile(id) {
    let params = {
        "prolific_id": id
    };    
    let xhr = new XMLHttpRequest();
    xhr.open('POST', 'web_API/checkID.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function(){
        response = this.responseText;
        console.log(response);
        switch(response) {
            case '0':
                break; // stay on page if no data is available but ID is entered
            case '1':
                window.location.assign('questionnaires.html');
                break;
            case '2':
                let outTimeline = [];
                let usedID = {
                    type: "html-keyboard-response",
                    stimulus: `<p>Your ID is already used. Thank you for participating!</p>`,
                    margin_vertical: '100px',
                    choices: jsPsych.NO_KEYS
                    };
                outTimeline.push(usedID);
                jsPsych.init({
                    timeline: outTimeline,
                });
        }
    };

    xhr.send(JSON.stringify(params));
}