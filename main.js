// Determine if Device is a Phone
if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    // Hide Items that are not Mobile Friendly
    document.getElementsByClassName('Mobile').style.visibility='hidden';
    document.getElementById('nav').style.fontSize='50';
    document.getElementById('logo').style.width='40'
  }else{
    // Shows Items that are not Mobile Friendly but are PC fine
    document.getElementsByClassName('Mobile').style.visibility='visible';
    document.getElementById('logo').style.width='20'
      document.getElementById('nav').style.fontSize='30';
  }


