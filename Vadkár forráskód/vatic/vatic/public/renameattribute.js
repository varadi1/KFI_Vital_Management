
  $('#vidname').change(function() {
      server_request("getlabelswithattr", [document.getElementById("vidname").value], function(response) {
	document.getElementById("Labels").innerHTML =response;		
	});

   });


