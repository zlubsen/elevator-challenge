{
    init: function(elevators, floors) {
		var topFloor = floors.length-1;
		var waitingQueue = [];

        for(var elevatorNo in elevators) {
            registerElevatorEvents(elevators[elevatorNo]);
        }
        for(var floorNo in floors) {
            registerFloorEvents(floors[floorNo]);
            //floors[floorNo].hasWaiting = false;
        }
   
		function registerElevatorEvents(elevator) {
        	elevator.on("idle", function() {
                console.log("elevator idle at: " + elevator.currentFloor());
                // wait for someone calling an elevator
                
                setElevatorAvailable(elevator);

                // Go to the first floor where someone is waiting.
                if(waitingQueue.length > 0) {
                    console.log("going to floor " + waitingQueue[0] + ", because someone is waiting there.");
                    elevator.goToFloor(floors[waitingQueue.shift()].floorNum());
                } else
                    console.log("no-one is waiting, going to 0");
                    elevator.goToFloor(0);
				// next step: if no-one is waiting, go to a 'strategic' floor to wait for passengers
			});
			
			elevator.on("floor_button_pressed",function(floorNum){
				// add floor to queue
				// set direction indicator via goingUpIndicator and goingDownIndicator
				
				/*if(elevatorIsFull(elevator)){
					setElevatorNotAvailable(elevator);
				}*/

				// add to queue, make sure it is in the order in which we are travelling, and continue travel
				elevator.destinationQueue.push(floorNum);
				elevator.destinationQueue.sort();
				if(elevator.destinationDirection() === "down")
					elevator.destinationQueue.reverse();

				elevator.checkDestinationQueue();

				// next step: only add to the queue when elevator is not yet going to that floor and it is in the same direction
				// next step: people going the other direction are added to the end of the queue
				
			});
			
			elevator.on("passing_floor",function(floorNum, direction){
				// what to do when we are passing a floor?

				// next step: check if there are people going in the direction of the elevator
			});
			
			elevator.on("stopped_at_floor",function(floorNum){
				// what to do when we stop at a floor?

				floors[floorNum].waitingQueue = false;

				/*if(!elevatorIsFull(elevator)){
					setElevatorAvailable(elevator);
				}
				goToNextDestination(elevator);*/
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
				console.log("one is already passing by!");
				passingElevators[0].goToFloor(floorNum);
			} else {
				// else, find and send an idle elevator
				console.log("find idle elevator for floor: " + floorNum);
				//floors[floorNum].hasWaiting = true;
				waitingQueue.push(floorNum);
			}

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
/*		function findLeastBusyElevator(){
			var leastBusy = 0;
			for(var elevatorNo in elevators){
				if(elevators[elevatorNo].destinationQueue.length < elevators[leastBusy].destinationQueue.length)
					leastBusy = elevatorNo;
			}
			return leastBusy;
		}
*/		
		function findAvailableOrPassingElevator(fromFloorNo, direction){
			var availableElevators;
			availableElevators = elevators.filter(function(elevator) {return elevator.destinationDirection === direction});
			if(direction === "up")
				availableElevators = availableElevators.filter(function(elevator) {return elevator.currentFloor < fromFloorNo});
			else
				availableElevators = availableElevators.filter(function(elevator) {return elevator.currentFloor > fromFloorNo});

			return availableElevators;
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