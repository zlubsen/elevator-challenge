{
    init: function(elevators, floors) {
		var topFloor = floors.length-1;
		var waitingQueue = []; // queue of [floornumber,direction]-pairs where people are waiting for an elevator.

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

        // Go to the first floor where someone is waiting, remove request from waitingQueue.
        if(waitingQueue.length > 0) {
          console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": servicing waitingQueue, going to floor " + waitingQueue[0].floor + ", because someone is waiting there.");
          var queueItem = waitingQueue.shift();
          console.log("@floor: " + queueItem.floor + " @dir: " + queueItem.dir);
          elevator.goToFloor(queueItem.floor);
        } else {
            console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": no-one is waiting, going to 0");
            elevator.goToFloor(0);
        }

        setElevatorAvailable(elevator);

				// next step: if no-one is waiting, go to a 'strategic' floor to wait for passengers

        printElevatorQueue(elevator);
			});

			elevator.on("floor_button_pressed",function(floorNum){
				// add floor to queue
				// set direction indicator via goingUpIndicator and goingDownIndicator
				console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": someone got in and wants to go to floor: " + floorNum);

				// add to queue, make sure it is in the order in which we are travelling, and continue travel
				elevator.destinationQueue.push(floorNum);
        elevator.destinationQueue.sort(function(a, b){return a-b});
        if(elevator.destinationDirection() === "down")
          elevator.destinationQueue.reverse();

				elevator.checkDestinationQueue();

        printElevatorQueue(elevator);
			});

  			elevator.on("passing_floor",function(floorNum, direction){
  				// what to do when we are passing a floor?
          // see if this there is a request for <floor, direction> in the waitingQueue. If so, stop here and clear all such entries in the waitingQueue
          if(!elevatorIsFull(elevator)) {
            var queueIds = []
            for(var item in waitingQueue) {
              if(waitingQueue[item].floor == floorNum && waitingQueue[item].dir == direction) {
                queueIds.push(item);
              }
            }
            console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": passing floor: " + floorNum);

            if(queueIds.length > 0) {
              console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": found someone waiting for the same direction we're going: " + direction);
              elevator.destinationQueue.unshift(floorNum);
              elevator.checkDestinationQueue();

              waitingQueue = waitingQueue.filter(function(item) {return (item.floor != floorNum) && (item.dir != direction);});
              printWaitingQueue();
            }
          }

  			});

  			elevator.on("stopped_at_floor",function(floorNum){
  				// people can get in here; if the waitingQueue says there is someone, remove the request from the queue.
          console.log("Elevator " + elevator.id + " at " + elevator.currentFloor() + ": Stopping at floor " + floorNum);

          waitingQueue = waitingQueue.filter(function(item) {return (item.floor != floorNum) && (item.dir != elevator.destinationDirection());});

          setElevatorAvailable(elevator);

          printElevatorQueue(elevator);
          printWaitingQueue();
			});
		}

		function registerFloorEvents(floor) {
			floor.on("up_button_pressed",function(){
        console.log("up_button_pressed at floor: " + floor.floorNum());
        addToWaitingQueue(floor.floorNum(),"up");
				//dispatchElevator(floor.floorNum(),"up");
			});
			floor.on("down_button_pressed",function(){
        console.log("down_button_pressed at floor: " + floor.floorNum());
        addToWaitingQueue(floor.floorNum(),"down");
				//dispatchElevator(floor.floorNum(),"down");
        	});
		}

    function addToWaitingQueue(floorNum, direction) {
      console.log("Request: " + floorNum + ", " + direction + ": queue-ing for floor: " + floorNum);
      waitingQueue.push({floor:floorNum, dir:direction});
    }

    function elevatorIsFull(elevator) {
      if(elevator.loadFactor() > 0.95) {
        return true;
      }
      return false;
    }

    // Not used anymore
		function dispatchElevator(floorNum, direction) {
			// first check if there is an elevator moving, and already passing the floor in the right direction
			var passingElevators = findPassingElevator(floorNum,direction);
      console.log("Dispatch - # passing elevators found: " + passingElevators.toString());
			//passingElevators.sort(function(a,b){a.loadFactor()-b.loadFactor()});
			if(passingElevators.length>0) {
        // so there is one that is passing by, reroute the elevator to also stop at this floor
        var id = passingElevators[0].id;
				console.log("Request: " + floorNum + ", " + direction + ": One is already passing by! Elevator is rerouted.");
				elevators[id].destinationQueue.unshift(floorNum);
        console.log("Destqueue length: " + elevators[id].destinationQueue);
        elevators[id].checkDestinationQueue();

        printElevatorQueue(elevators[id]);
			} else {
				// otherwise signal that someone is waiting at this floor; push to end of the queue
				console.log("Request: " + floorNum + ", " + direction + ": queue-ing for floor: " + floorNum);
				waitingQueue.push(floorNum);
			}
      printWaitingQueue();

		}

  function findPassingElevator(fromFloorNo, direction) {
    var passingElevators;
    console.log("Finding passing elevators: 0) from " + fromFloorNo + " going " + direction);

    passingElevators = elevators.filter(function(elevator) {return elevator.destinationDirection() == direction});
    console.log("Finding passing elevators: 1) elevators going same dir: " + passingElevators.toString());

    if(direction === "up") {
      passingElevators = passingElevators.filter(function(elevator) {return elevator.currentFloor() < fromFloorNo});
    } else {
      passingElevators = passingElevators.filter(function(elevator) {return elevator.currentFloor() > fromFloorNo});
    }

    console.log("Finding passing elevators: 2) elevators above or below this floor: " + passingElevators.toString());

    return passingElevators;
  }

		function setElevatorGoingUp(elevator) {
			elevator.goingUpIndicator(true);
			elevator.goingDownIndicator(false);
		}
		function setElevatorGoingDown(elevator) {
			elevator.goingUpIndicator(false);
			elevator.goingDownIndicator(true);
		}
		function setElevatorIdle(elevator) {
			elevator.goingUpIndicator(false);
			elevator.goingDownIndicator(false);
		}
		function setElevatorAvailable(elevator) {
			elevator.goingUpIndicator(true);
			elevator.goingDownIndicator(true);
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
    for(elevatorNo in elevators){
      setElevatorDirectionIndicator(elevators[elevatorNo]);
    }

    function elevatorIsFull(elevator) {
      if(elevator.loadFactor() > 0.95) {
        return true;
      }
      return false;
    }

    function setElevatorDirectionIndicator(elevator){
      // people are in the elevator, and we're already moving
      switch(elevator.destinationDirection()) {
        case "up":
          elevator.goingUpIndicator(true);
          elevator.goingDownIndicator(false);
          break;
        case "down":
          elevator.goingUpIndicator(false);
          elevator.goingDownIndicator(true);
          break;
        case "stopped":
          elevator.goingUpIndicator(true);
          elevator.goingDownIndicator(true);
        break;
      }

      // when full - signal no more people allowed
      if(elevatorIsFull(elevator)){
        elevator.goingUpIndicator(false);
        elevator.goingDownIndicator(false);
      }

      // no-one is in the elevator, all directions allowed on next press in the elevator
      if(elevator.loadFactor() === 0) {
        elevator.goingUpIndicator(true);
        elevator.goingDownIndicator(true);
      }

    }
  }
}
