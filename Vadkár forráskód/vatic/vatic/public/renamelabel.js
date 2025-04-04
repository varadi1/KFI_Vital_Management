
  $('#vidname').change(function() {
      server_request("getlabels", [document.getElementById("vidname").value], function(response) {
	document.getElementById("Labels").innerHTML =response;		
	});

   });

