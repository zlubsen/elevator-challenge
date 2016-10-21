{
    init: function(elevators, floors) {
		var topFloor = floors.length-1;
		var waitingQueue = []; // queue of floornumbers where people are waiting for an elevator.

    for(var elevatorNo in elevators) {
        registerElevatorEvents(elevators[elevatorNo]);
    }
    for(var floorNo in floors) {
        registerFloorEvents(floors[floorNo]);
    }

    function registerElevatorEvents(elevator) {
      elevator.on("idle", function() {
        console.log("elevator idle at: " + elevator.currentFloor());

        setElevatorAvailable(elevator);

        // Go to the first floor where someone is waiting, remove request from waitingQueue.
        if(waitingQueue.length > 0) {
          console.log("going to floor " + waitingQueue[0] + ", because someone is waiting there.");
          var destinationFloorNo = waitingQueue.shift();
          elevator.goToFloor(destinationFloorNo);
          setElevatorDirectorIndicator(elevator,destinationFloorNo)
        } else {
            console.log("no-one is waiting, going to 0");
            elevator.goToFloor(0);
        }
				// next step: if no-one is waiting, go to a 'strategic' floor to wait for passengers
			});

			elevator.on("floor_button_pressed",function(floorNum){
				// add floor to queue
				// set direction indicator via goingUpIndicator and goingDownIndicator
				console.log("I want to go to floor: " + floorNum);

				// add to queue, make sure it is in the order in which we are travelling, and continue travel
				elevator.destinationQueue.push(floorNum);
				elevator.destinationQueue.sort();
				if(elevator.destinationDirection() === "down")
					elevator.destinationQueue.reverse();

				elevator.checkDestinationQueue();
			});

			elevator.on("passing_floor",function(floorNum, direction){
				// what to do when we are passing a floor?
			});

			elevator.on("stopped_at_floor",function(floorNum){
				// people can get in here; if the waitingQueue says there is someone, remove the request from the queue.
        if(waitingQueue[0] == floorNum)
				    waitingQueue.shift();
			});
		}

		function registerFloorEvents(floor) {
			floor.on("up_button_pressed ",function(){
				dispatchElevator(floor.floorNum(),"up");
			});
			floor.on("down_button_pressed ",function(){
				dispatchElevator(floor.floorNum(),"down");
        	});
		}

		function dispatchElevator(floorNum, direction) {
			// first check if there is an elevator moving, and already passing the floor in the right direction
			var passingElevators = findAvailableOrPassingElevator(floorNum,direction);
			//passingElevators.sort(function(a,b){a.loadFactor()-b.loadFactor()});
			if(passingElevators.length>0) {
        // so there is one that is passing by, reroute the elevator to also stop at this floor
				console.log("one is already passing by!");
				passingElevators[0].destinationQueue.unshift(floorNum);
        passingElevators[0].checkDestinationQueue();
			} else {
				// otherwise signal that someone is waiting at this floor; push to end of the queue
				console.log("find idle elevator for floor: " + floorNum);
				waitingQueue.push(floorNum);
			}

		}

  function findAvailableOrPassingElevator(fromFloorNo, direction){
    var availableElevators;

    availableElevators = elevators.filter(function(elevator) {return elevator.destinationDirection === direction});
    if(direction === "up")
      availableElevators = availableElevators.filter(function(elevator) {return elevator.currentFloor < fromFloorNo});
    else
      availableElevators = availableElevators.filter(function(elevator) {return elevator.currentFloor > fromFloorNo});

    return availableElevators;
  }

		function elevatorIsFull(elevator) {
			if(elevator.loadFactor() > 0.95) {
				return true;
			}
			return false;
		}
		function setElevatorGoingUp(elevator) {
			elevator.goingUpIndicator(true);
			elevator.goingDownIndicator(false);
		}
		function setElevatorGoingDown(elevator) {
			elevator.goingUpIndicator(false);
			elevator.goingDownIndicator(true);
		}
		function setElevatorNotAvailable(elevator) {
			elevator.goingUpIndicator(false);
			elevator.goingDownIndicator(false);
		}
		function setElevatorAvailable(elevator) {
			elevator.goingUpIndicator(true);
			elevator.goingDownIndicator(true);
		}
    function setElevatorDirectorIndicator(elevator,destinationFloorNo){
      if(elevator.currentFloor() >= destinationFloorNo)
        setElevatorGoingDown(elevator);
      else
        setElevatorGoingUp(elevator);
    }

	},
	update: function(dt, elevators, floors) {
		// We normally don't need to do anything here
	}

}
