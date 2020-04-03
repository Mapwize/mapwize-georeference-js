var assert = require('assert');
var mwzgeoref = require('../index.js');

function almostEqual(a, b) {
    return Math.abs(a - b) < 1e-8;
}

var georeference = { "points": [{ "x": 1310.2132295719841, "y": 1406.1883268482486, "latitude": 50.63264941120241, "longitude": 3.0202874193832945 }, { "x": 0, "y": 0, "latitude": 50.63261391508114, "longitude": 3.0206033053400465 }] };

describe('Georeference', function () {

    it('should project the first x/y to the first lat/lng', function () {
        var projected = mwzgeoref.projectPointForGeoreference([georeference.points[0].x, georeference.points[0].y], georeference);
        assert(almostEqual(projected[0], georeference.points[0].latitude));
        assert(almostEqual(projected[1], georeference.points[0].longitude));
    });

    it('should project the second x/y to the second lat/lng', function () {
        var projected = mwzgeoref.projectPointForGeoreference([georeference.points[1].x, georeference.points[1].y], georeference);
        assert(almostEqual(projected[0], georeference.points[1].latitude));
        assert(almostEqual(projected[1], georeference.points[1].longitude));
    });

    it('should unproject the first lat/lng to the first x/y', function () {
        var projected = mwzgeoref.unprojectLatLngForGeoreference([georeference.points[0].latitude, georeference.points[0].longitude], georeference);
        assert(almostEqual(projected[0], georeference.points[0].x));
        assert(almostEqual(projected[1], georeference.points[0].y));
    });

    it('should unproject the second lat/lng to the second x/y', function () {
        var projected = mwzgeoref.unprojectLatLngForGeoreference([georeference.points[1].latitude, georeference.points[1].longitude], georeference);
        assert(almostEqual(projected[0], georeference.points[1].x));
        assert(almostEqual(projected[1], georeference.points[1].y));
    });

});