
#!/bin/bash


SESSION_COUNT=40


for (( i=1; i<=SESSION_COUNT; i++ ))
do

	    SESSION_NAME="session$i"
	        echo "Starting $SESSION_NAME..."
		    
		  
		    screen -dmS "$SESSION_NAME" expect run.exp
	    done

	    echo "All $SESSION_COUNT sessions have been started."

