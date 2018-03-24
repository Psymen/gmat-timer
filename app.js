var myApp = angular.module('myApp', ['cfp.hotkeys']);

myApp.directive('inputSquare', function(){
  return {
    restrict: "A",
    replace: true,
    template: '<div style="width:150px; height:150px; background-color:black"></div>'
  };
});

myApp.controller('MainCtrl',['$scope','hotkeys','$interval',function($scope, hotkeys, $interval){
  // Just going to throw everything on the scope
  s = $scope;
  /*
    records {
      questions [{
        number
        choice
        flag
        timeFinishedString
        timeFinishedMin
        timeFinishedsec
        intervalPace
        cumPace
      }]
    }
  */

  // init
  $scope.numberOfQuestions = 0;
  $scope.timeLimit = 0;
  $scope.currentTimeLeft = {};
  $scope.currentTimeLeft.minutes = 75;
  $scope.currentTimeLeft.seconds = "00";
  $scope.mode = 'math'; // default mode
  $scope.currentTimeInterval = 121.62; // default pace
  $scope.currentTimeIntervalMin = 0; // default pace
  $scope.currentTimeIntervalSec = 0; // default pace
  $scope.currentChoice = null;
  $scope.record = {};
  $scope.timer = {};
  $scope.finished = false;
  $scope.currentQuestion = 1;
  $scope.paused = false;
  $scope.testing = false;

  $scope.mathDefault = {
    questionTimeSec : 121.62,
    numberOfQuestions : 37,
    timeLimit: 75
  };

  $scope.verbalDefault = {
    questionVerbalSec : 109.75,
    numberOfQuestions : 41,
    timeLimit: 75
  };

  $('#TestModal').on('hidden.bs.modal', function () {
    $scope.exitModal();
  });

  $scope.exitModal = function(){
    $interval.cancel($scope.timer);
    $scope.currentTimeLeft.minutes = parseInt($scope.timeLimit);
    $scope.finished = false;
    $scope.testing = false;
  };

  $scope.selectChoice = function(selection) {
    if($scope.testing){
      $scope.currentChoice = selection;
      console.log(selection);  
    }
    
  };

  $scope.timeString = function(minutes, seconds){
    var secondStr = (seconds<10 && seconds>-10)? "0"+seconds : seconds;
    return minutes+":"+secondStr;
  };

  $scope.intervalString = function(minutes, seconds) {
    if (minutes < 0 || seconds<0){
      return "-"+$scope.timeString(Math.abs(minutes), Math.abs(seconds));
    }
    else {
      return "+"+$scope.timeString(Math.abs(minutes), Math.abs(seconds));
    }
  };

  $scope.cumString = function(cum, addition){
    var cumNum = cum.split(":");
    var addNum = addition.split(":");
    var returnObj = {};
    var cumSign = cum.charAt(0) === "-"?-1:1;
    var additionSign = addition.charAt(0) === "-"?-1:1;
    var cumVal = cumSign*(Math.abs(parseInt(cumNum[0]))*60+parseInt(cumNum[1]));
    var addVal = additionSign*(Math.abs(parseInt(addNum[0]))*60+parseInt(addNum[1]));
    var returnVal = cumVal+addVal;
    var returnValMin = Math.abs(Math.floor(parseInt(returnVal/60)));
    var returnValSec = Math.abs(returnVal % 60);
    returnValSec = returnValSec < 10? "0"+returnValSec:returnValSec;
    var returnSign = (returnVal <0)?"-":"+";
    return returnSign+returnValMin+":"+returnValSec;
  }

  $scope.confirmChoice = function(){
    if($scope.testing){
      $scope.currentIndex = $scope.currentQuestion-1;
      $scope.record.question[$scope.currentIndex].choice = $scope.currentChoice;
      var finishObj = $scope.subtractTime($scope.currentTimeLeft.minutes, $scope.currentTimeLeft.seconds, $scope.timeLimit, 0);
      $scope.record.question[$scope.currentIndex].timeFinishedMin = finishObj.minutes;
      $scope.record.question[$scope.currentIndex].timeFinishedSec = finishObj.seconds;
      $scope.record.question[$scope.currentIndex].timeFinishedString = $scope.timeString(finishObj.minutes,finishObj.seconds);

      if($scope.currentIndex === 0){
        var timeItTook = $scope.subtractTime(0,0,finishObj.minutes,finishObj.seconds);
      }
      else {
        var timeItTook = $scope.subtractTime($scope.record.question[$scope.currentIndex-1].timeFinishedMin,$scope.record.question[$scope.currentIndex-1].timeFinishedSec ,finishObj.minutes,finishObj.seconds);  
      }
      var intervalPace = $scope.subtractTime($scope.currentTimeIntervalMin,$scope.currentTimeIntervalSec,timeItTook.minutes,timeItTook.seconds);
      $scope.record.question[$scope.currentIndex].intervalPace = $scope.intervalString(intervalPace.minutes,intervalPace.seconds);
      if($scope.currentIndex === 0){
        $scope.record.question[$scope.currentIndex].cumPace = $scope.record.question[$scope.currentIndex].intervalPace;
      }
      else{
        $scope.record.question[$scope.currentIndex].cumPace = $scope.cumString($scope.record.question[$scope.currentIndex-1].cumPace, $scope.record.question[$scope.currentIndex].intervalPace);
      }

      // iterate question
      if($scope.currentChoice !== null){
        $scope.currentQuestion = $scope.currentQuestion + 1;  
        $scope.currentChoice = null;
      }  
    }
  };

  // Main function
  $scope.startTimer = function() {
    if ($scope.timeLimit === 0 && $scope.numberOfQuestions === 0) {
      console.log("No settings set");
      return;
    }

    $scope.currentTimeInterval = parseFloat($scope.timeLimit) / parseFloat($scope.numberOfQuestions);
    // some rounding error, but that's okay
    $scope.currentTimeIntervalMin = Math.floor($scope.currentTimeInterval);
    $scope.currentTimeIntervalSec = Math.ceil(($scope.currentTimeInterval % 1) * 60);

    $scope.testing = true;
    $('#TestModal').modal('show');
    $scope.currentQuestion = 1;

    $scope.record = {
      question : []
    };

    for(var i=0;i<$scope.numberOfQuestions;i++){
      var questionObj = {
        number: i+1,
        choice: null,
        flag: false,
        timeFinishedMin: 0,
        timeFinishedsec: 0,
        intervalPace: "",
        cumPace: ""
      };

      $scope.record.question.push(questionObj);
    }

    $scope.currentTimeLeft.minutes = parseInt($scope.timeLimit);
    $scope.currentTimeLeft.seconds = "00"; 
    $scope.timer = $interval($scope.updateTime, 1000);  
  };

  $scope.updateTime = function(){
    
    var currentMin = $scope.currentTimeLeft.minutes;
    var currentSeconds = parseInt($scope.currentTimeLeft.seconds);
    // console.log('update time: ',$scope.currentTimeLeft.minutes," ",$scope.currentTimeLeft.seconds);
    if(currentSeconds === 0 && currentMin === 0){
      $interval.cancel($scope.timer);
      $scope.finished = true;
    }
    else if (currentSeconds === 0) {
      $scope.currentTimeLeft.minutes = $scope.currentTimeLeft.minutes - 1;
      $scope.currentTimeLeft.seconds = "59";
    }
    else {
      $scope.currentTimeLeft.seconds = currentSeconds -1;
      if($scope.currentTimeLeft.seconds < 10){
        $scope.currentTimeLeft.seconds = "0"+$scope.currentTimeLeft.seconds;
      }
      else {
        $scope.currentTimeLeft.seconds = $scope.currentTimeLeft.seconds+"";
      }
    }
  };

  $scope.exportAsCSV = function(){

    var csvContent = "application/csv;charset=utf-8,number,choice,time,interval_pace,cumulative_pace,flag\n";
    for(var i in $scope.record.question){
      var question = $scope.record.question[i];
      question.number = question.number ? question.number : "";
      question.choice = question.choice ? question.choice : "";
      question.timeFinishedString = question.timeFinishedString ? question.timeFinishedString : "";
      question.intervalPace = question.intervalPace ? question.intervalPace : "";
      question.cumPace = question.cumPace ? question.cumPace : "";
      question.flag = question.flag ? question.flag : "";
      csvContent += question.number+","+question.choice+","+question.timeFinishedString+","+question.intervalPace+","+question.cumPace+","+question.flag+"\n";
    }
    
    var encodedURI = encodeURIComponent(csvContent);
    window.open(encodedURI);
    
    // var a = document.createElement("a");
    // a.setAttribute("href", encodedURI);
    // a.setAttribute("download", "GMAT_TIMER.csv");
    // a.click();

    console.log('csvcontent',csvContent);
  }

  $scope.subtractTime = function(startingMin, startingSec, finishMin, finishSec) {
    var smin = parseFloat(startingMin);
    var ssec = parseFloat(startingSec);
    var fmin = parseFloat(finishMin);
    var fsec = parseFloat(finishSec);

    var minDiff = fmin - smin;
    var secDiff = fsec - ssec;
    //5:14 6:10 = 0:56
    if (secDiff < 0 && minDiff>0){
        minDiff = minDiff - 1;
        secDiff = secDiff + 60;  
    }
    else if(secDiff >0 && minDiff<0){
      minDiff = minDiff + 1;
      secDiff = secDiff-60;
    }

    return {
      minutes: minDiff,
      seconds: secDiff.toFixed(0)
    };
  };

  $scope.reset = function() {
    if($scope.testing){
      $scope.currentChoice = null;
    }
    else {
      $scope.record.question = null;
      $scope.timeLimit = 0;
      $scope.numberOfQuestions = 0;
    }
  };

  $scope.setMode = function(mode) {
    if(!$scope.testing){
      $scope.mode = mode;
      if(mode === 'verbal') {
        $scope.numberOfQuestions = $scope.verbalDefault.numberOfQuestions;
        $scope.timeLimit = $scope.verbalDefault.timeLimit;
      }
      else if(mode === 'math') {
        $scope.numberOfQuestions = $scope.mathDefault.numberOfQuestions;
        $scope.timeLimit = $scope.mathDefault.timeLimit;
      }  
    }
  };

  $scope.pause = function() {
    if($scope.testing){
      $scope.paused = !$scope.paused;
      console.log("pause", $scope.paused);
    
      if($scope.paused){ // just paused
        $interval.cancel($scope.timer);
      }
      else{
        $scope.timer = $interval($scope.updateTime, 1000);  
      }  
    }
  };

  $scope.flagString = function(flag) {
    if(flag){
      return 'X';
    }
    return '';
  };

  hotkeys.add({
    combo: 's',
    description: 'Start Timer',
    callback: function() {
      $scope.startTimer();
    }
  });

  hotkeys.add({
    combo: '1',
    description: 'Select Choice A',
    callback: function() {
      $scope.selectChoice('A');
    }
  });

  hotkeys.add({
    combo: '2',
    description: 'Select Choice B',
    callback: function() {
      $scope.selectChoice('B');
    }
  });

  hotkeys.add({
    combo: '3',
    description: 'Select Choice C',
    callback: function() {
      $scope.selectChoice('C');
    }
  });

  hotkeys.add({
    combo: '4',
    description: 'Select Choice D',
    callback: function() {
      $scope.selectChoice('D');
    }
  });

  hotkeys.add({
    combo: '5',
    description: 'Select Choice E',
    callback: function() {
      $scope.selectChoice('E');
    }
  });

  hotkeys.add({
    combo: 'enter',
    description: 'Confirm Choice',
    callback: function() {
      $scope.confirmChoice();
    }
  });

  hotkeys.add({
    combo: 'r',
    description: 'Reset',
    callback: function() {
      $scope.reset();
    }
  });

  hotkeys.add({
    combo: 'f',
    description: 'Flag question',
    callback: function() {
      console.log("flag");
      if($scope.record && $scope.testing){
        $scope.record.question[$scope.currentQuestion-1].flag = !$scope.record.question[$scope.currentQuestion-1].flag;  
        console.log('toggled');
      }
    }
  });

  hotkeys.add({
    combo: 'p',
    description: 'Pause timer',
    callback: function() {
      $scope.pause();
    }
  });

  hotkeys.add({
    combo: 'm',
    description: 'Math Default Settings',
    callback: function() {
      $scope.setMode('math');
    }
  });

  hotkeys.add({
    combo: 'v',
    description: 'Verbal Default Settings',
    callback: function() {
      $scope.setMode('verbal');
    }
  });

  // hotkeys.add({
  //   combo: 'e',
  //   description: 'Export as CSV',
  //   callback: function() {
  //     if(!$scope.testing){
  //       $scope.exportAsCSV();  
  //     }
  //   }
  // });

  // hotkeys.add({
  //   combo: 'n',
  //   description: 'Number of Questions (focus)',
  //   callback: function() {
  //     if(!$scope.testing){
  //       $('#numOfQuestions').focus();
  //     }
  //   }
  // });

  // hotkeys.add({
  //   combo: 't',
  //   description: 'Time Limit (focus)',
  //   callback: function() {
  //     if(!$scope.testing){
  //       $('#timeLimit').focus();
  //     }
  //   }
  // });
}]);