/**
 * Created by liling on 1/8/17.
 */

app.factory('passObjService', function() {
    var savedData = {}
    function set(data) {
        savedData = data;
    }
    function get() {
        return savedData;
    }

    return {
        set: set,
        get: get
    }

});