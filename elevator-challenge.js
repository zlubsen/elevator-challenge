{
    init: function(elevators, floors) {
		var topFloor = floors.length-1;
		var waitingQueue = []; // queue of floornumbers where people are waiting for an elevator.

    for(var elevatorNo in elevators) {
        elevators[elevatorNo].id = elevatorNo;
        registerElevatorEvents(elevators[elevatorNo]);
    }
    for(var floorNo in floors) {
        registerFloorEvents(floors[floorNo]);
    }

    function registerElevatorEvents(elevator) {
      elevator.on("idle", function() {
        console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": idle at floor " + elevator.currentFloor());

        //setElevatorAvailable(elevator);

        // Go to the first floor where someone is waiting, remove request from waitingQueue.
        if(waitingQueue.length > 0) {
          console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": servicing waitingQueue, going to floor " + waitingQueue[0] + ", because someone is waiting there.");
          var destinationFloorNo = waitingQueue.shift();
          elevator.goToFloor(destinationFloorNo);
          //setElevatorDirectorIndicator(elevator,destinationFloorNo)
        } else {
            console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": no-one is waiting, going to 0");
            elevator.goToFloor(0);
        }
				// next step: if no-one is waiting, go to a 'strategic' floor to wait for passengers

        printElevatorQueue(elevator);
			});

			elevator.on("floor_button_pressed",function(floorNum){
				// add floor to queue
				// set direction indicator via goingUpIndicator and goingDownIndicator
				console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": someone got in and wants to go to floor: " + floorNum);

				// add to queue, make sure it is in the order in which we are travelling, and continue travel
				elevator.destinationQueue.push(floorNum);
				//elevator.destinationQueue.sort();
				//if(elevator.destinationDirection() === "down")
				//	elevator.destinationQueue.reverse();

				elevator.checkDestinationQueue();

        printElevatorQueue(elevator);
			});

  			elevator.on("passing_floor",function(floorNum, direction){
  				// what to do when we are passing a floor?
  			});

  			elevator.on("stopped_at_floor",function(floorNum){
  				// people can get in here; if the waitingQueue says there is someone, remove the request from the queue.
          console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": Stopping at floor " + floorNum);
/*          if(waitingQueue[0] == floorNum) {
            console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": We're at the same floor as the head of the waitingQueue, removing");
				    waitingQueue.shift();
          }*/
          waitingQueue = waitingQueue.filter(function(item) {return item != floorNum;});

          printElevatorQueue(elevator);
          printWaitingQueue();
			});
		}

		function registerFloorEvents(floor) {
			floor.on("up_button_pressed",function(){
				dispatchElevator(floor.floorNum(),"up");
        console.log("up_button_pressed at floor: " + floor.floorNum());
			});
			floor.on("down_button_pressed",function(){
				dispatchElevator(floor.floorNum(),"down");
        console.log("down_button_pressed at floor: " + floor.floorNum());
        	});
		}

		function dispatchElevator(floorNum, direction) {
			// first check if there is an elevator moving, and already passing the floor in the right direction
			var passingElevators = findPassingElevator(floorNum,direction);
      console.log("Dispatch - # passing elevators found: " + passingElevators.toString());
			//passingElevators.sort(function(a,b){a.loadFactor()-b.loadFactor()});
			if(passingElevators.length>0) {
        // so there is one that is passing by, reroute the elevator to also stop at this floor
				console.log("Request: " + floorNum + ", " + direction + ": One is already passing by! Elevator is rerouted.");
				passingElevators[0].destinationQueue.unshift(floorNum);
        console.log("Destqueue length: " + passingElevators[0].destinationQueue)
        passingElevators[0].checkDestinationQueue();

        printElevatorQueue(passingElevators[0]);
			} else {
				// otherwise signal that someone is waiting at this floor; push to end of the queue
				console.log("Request: " + floorNum + ", " + direction + ": queue-ing for floor: " + floorNum);
				waitingQueue.push(floorNum);
        console.log
			}
      printWaitingQueue();

		}

  function findPassingElevator(fromFloorNo, direction){
    var availableElevators;

    availableElevators = elevators.filter(function(elevator) {return elevator.destinationDirection() === direction});
    if(direction === "up")
      availableElevators = availableElevators.filter(function(elevator) {return elevator.currentFloor() < fromFloorNo});
    else
      availableElevators = availableElevators.filter(function(elevator) {return elevator.currentFloor() > fromFloorNo});

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

    function printElevatorQueue(elevator) {
      console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + " queue: " + elevator.destinationQueue.toString());
    }

    function printWaitingQueue() {
      console.log("Waiting Queue: " + waitingQueue.toString());
    }

	},
	update: function(dt, elevators, floors) {
		// We normally don't need to do anything here
	}

}
