define(['jquery', 'jquerycookies'], function($) {

  function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  var csrftoken = $.cookie('csrftoken');

  $.ajaxSetup({
    // For IE! (otherwise the status won't refresh because the response is cached)
    cache: false,

    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
      if (!csrfSafeMethod(settings.type)) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    }
  });

  // For potential debugging:
  return {
    csrftoken: csrftoken
  };

});
