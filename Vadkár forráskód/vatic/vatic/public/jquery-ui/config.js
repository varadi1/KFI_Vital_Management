//config for applications:
//number of applications:
var NumberOfApplications=4
var ApplicationArray=new Array(NumberOfApplications)
for (i=0; i <NumberOfApplications; i++)
    ApplicationArray[i]=new Array(2)

//array of applications: [name of applicaitons, objects]
ApplicationArray[0][0]="NCS";
ApplicationArray[0][1]="'Car ~Moving ~Parked Truck ~Moving ~Parked Bus ~Moving ~Parked Bike ~Moving ~Parked Pedestrian'";
ApplicationArray[1][0]="ADAS";
ApplicationArray[1][1]="'Car ~Moving ~Parked Truck ~Moving ~Parked Bus ~Moving ~Parked Bike ~Moving ~Parked Pedestrian'";
ApplicationArray[2][0]="UAS";
ApplicationArray[2][1]="'Car ~Moving ~Parked Truck ~Moving ~Parked Bus ~Moving ~Parked Bike ~Moving ~Parked Pedestrian'";
ApplicationArray[3][0]="TimeLapse";
ApplicationArray[3][1]="'Car ~Moving ~Parked Truck ~Moving ~Parked Bus ~Moving ~Parked Bike ~Moving ~Parked Pedestrian'";
 



//end of config these functions will set the elements.

for (var i = 0; i <  ApplicationArray.length; i++) {
	if (i==0){
		document.getElementById("AppType").options[i]=new Option(ApplicationArray[i][0], ApplicationArray[i][0], true, true);
	}
	else{
		document.getElementById("AppType").options[i]=new Option(ApplicationArray[i][0], ApplicationArray[i][0], false, false);
	}
}

document.getElementById("Objects").innerHTML =ApplicationArray[0][1];	
document.getElementById("VaticObjects").value =ApplicationArray[0][1];

 $('#AppType').change(function() {
      var arrayLength = ApplicationArray.length;
      for (var i = 0; i < arrayLength; i++) {
      if($(this).val() == ApplicationArray[i][0])
      	{
         document.getElementById("Objects").innerHTML =ApplicationArray[i][1];
	 document.getElementById("VaticObjects").value =ApplicationArray[i][1];
      	}
      }
   });

