define(['jquery'], function($) {

  var $idown;  

  var downloadURL = function(url) {
    if ($idown) {
      $idown.attr('src',url);
    } else {
      $idown = $('<iframe>', { id:'idown', src:url }).hide().appendTo('body');
    }
  };


  return downloadURL;
});
