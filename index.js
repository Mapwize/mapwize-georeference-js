
var _ = require('lodash');
var SphericalMercator = require('sphericalmercator');

/**
 *  Coordinate transformation
 */
var merc = new SphericalMercator({
    size: 256
});

function getPerpendicular(vector) {
    return [vector[1], -vector[0]];
}

function length(vector) {
    return Math.hypot(vector[0], vector[1]);
}

function scalarProduct(a, b) {
    return (a[0]*b[0])+(a[1]*b[1]);
}

function angleBetween(a, b) {
    return Math.acos(scalarProduct(a, b)/(length(a)* length(b)));
}

// a + b
function add(a, b) {
    return [a[0]+b[0], a[1]+b[1]];
}

// a - b
function subtract(a, b) {
    return [a[0]-b[0], a[1]-b[1]];
}

// scalar * vector
function multiplyBy(vector, scalar) {
    return [vector[0]*scalar, vector[1]*scalar];
}

exports.projectPointForGeoreference = function(point, georeference) {
    var point0 = point;
    var point1 = [georeference.points[0].x, georeference.points[0].y];
    var point2 = [georeference.points[1].x, georeference.points[1].y];
    var latLng1 = [georeference.points[0].latitude, georeference.points[0].longitude];
    var latLng2 = [georeference.points[1].latitude, georeference.points[1].longitude];

    var point12 = subtract(point2, point1);
    var point10 = subtract(point0, point1);
    var point12perpendicular = getPerpendicular(point12);

    var projectParallel = scalarProduct(point12, point10) / (length(point12)*length(point12));
    var projectPerpendicular = scalarProduct(point12perpendicular, point10) / (length(point12perpendicular)*length(point12perpendicular));

    var pxLatLng1 = merc.forward([latLng1[1], latLng1[0]]); //merc is working in lng/lat
    var pxLatLng2 = merc.forward([latLng2[1], latLng2[0]]); //merc is working in lng/lat

    var pxLatLng0 = add(add(pxLatLng1, multiplyBy(subtract(pxLatLng2, pxLatLng1), projectParallel)), multiplyBy(getPerpendicular(subtract(pxLatLng2, pxLatLng1)), projectPerpendicular));
    var latLng0 = merc.inverse(pxLatLng0);

    return [latLng0[1], latLng0[0]];
};

exports.projectFeatureForGeoreference = function(feature, georeference) {
    var _feature = _.cloneDeep(feature);

    if (_feature.geometry.type === 'Point') {
        var projectedPoint = exports.projectPointForGeoreference(_feature.geometry.coordinates, georeference);
        _feature.geometry.coordinates = [projectedPoint[1], projectedPoint[0]]; //GeoJSON is lng/lat
    } else if (_feature.geometry.type === 'Polygon') {
        _feature.geometry.coordinates = _.map(_feature.geometry.coordinates, function(innerPolygon){
            return _.map(innerPolygon, function(point) {
                var projectedPoint = exports.projectPointForGeoreference(point, georeference);
                return [projectedPoint[1], projectedPoint[0]]; //GeoJSON is lng/lat
            });
        });
    } else if (_feature.geometry) {
        console.log('GEOMETRY TYPE NOT SUPPORTED ' + feature.geometry.type);
    } else {
        console.log('GEOMETRY TYPE NOT SUPPORTED NULL');
    }

    return _feature;
};

exports.unprojectLatLngForGeoreference = function(latLng, georeference) {
    var latLng0 = latLng;
    var point1 = [georeference.points[0].x, georeference.points[0].y];
    var point2 = [georeference.points[1].x, georeference.points[1].y];
    var latLng1 = [georeference.points[0].latitude, georeference.points[0].longitude];
    var latLng2 = [georeference.points[1].latitude, georeference.points[1].longitude];
    
    var pxLatLng0 = merc.forward([latLng0[1], latLng0[0]]); //merc is working in lng/lat
    var pxLatLng1 = merc.forward([latLng1[1], latLng1[0]]); //merc is working in lng/lat
    var pxLatLng2 = merc.forward([latLng2[1], latLng2[0]]); //merc is working in lng/lat

    var pxLatLng12 = subtract(pxLatLng2, pxLatLng1);
    var pxLatLng10 = subtract(pxLatLng0, pxLatLng1);
    var pxLatLng12perpendicular = getPerpendicular(pxLatLng12);

    var projectParallel = scalarProduct(pxLatLng12, pxLatLng10) / (length(pxLatLng12)*length(pxLatLng12));
    var projectPerpendicular = scalarProduct(pxLatLng12perpendicular, pxLatLng10) / (length(pxLatLng12perpendicular)*length(pxLatLng12perpendicular));

    var point0 = add(add(point1, multiplyBy(subtract(point2, point1), projectParallel)), multiplyBy(getPerpendicular(subtract(point2, point1)), projectPerpendicular));
    
    return point0;
};

exports.unprojectFeatureForGeoreference = function(feature, georeference) {
    var _feature = _.cloneDeep(feature);

    if (_feature.geometry.type === 'Point') {
        var projectedPoint = exports.unprojectLatLngForGeoreference([_feature.geometry.coordinates[1], _feature.geometry.coordinates[0]], georeference);
        _feature.geometry.coordinates = [projectedPoint[1], projectedPoint[0]]; //GeoJSON is lng/lat
    } else if (_feature.geometry.type === 'Polygon') {
        _feature.geometry.coordinates = _.map(_feature.geometry.coordinates, function(innerPolygon){
            return _.map(innerPolygon, function(point) {
                var projectedPoint = exports.unprojectLatLngForGeoreference([point[1], point[0]], georeference); //GeoJSON is lng/lat
                return projectedPoint;
            });
        });
    } else if (_feature.geometry) {
        console.log('GEOMETRY TYPE NOT SUPPORTED ' + feature.geometry.type);
    } else {
        console.log('GEOMETRY TYPE NOT SUPPORTED NULL');
    }

    return _feature;
};