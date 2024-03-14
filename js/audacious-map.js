String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

var countries = {};
var projectCountries = [];
var activeCountries = {};
var currentTab = 'country-map';
var centroids = {};

fetch('/countries.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(jsonData) {
    countries = jsonData;
    countriesList = Object.keys(countries);
    projectCountries = countriesList.filter(function(item) {
      return countries[item].audacious;
    });
  }
);

function getCountriesByContinent(continent) {
  return projectCountries.filter(function(item) {
    return countries[item].continent === continent;
  });
}

function generateCountriesLinks(continent) {
  continentCountries = getCountriesByContinent(continent);
  $("#continents").addClass('hide');
  $("#countries-list").empty();
  continentCountries.map(function(item) {
    $("#countries-list").append(
      '<a href="/where-we-work/' + item.split(' ').join('-') + '" class="regions-link">' +
      item.capitalize() +
      '</a>'
    );
  });
  $("#countries-list").append('<p><a class="back-btn" onClick="showContinents()">Back to regions</a></p>');
}

function activateAfrica() {
  generateCountriesLinks('AF');
}
function activateAsia() {
  generateCountriesLinks('AS');
}
function activateEurope() {
  generateCountriesLinks('EU');
}
function activateNAmerica() {
  generateCountriesLinks('NA');
}
function activateSAmerica() {
  generateCountriesLinks('SA');
}
function activateOceania() {
  generateCountriesLinks('OC');
}

function showContinents() {
  $("#continents").removeClass('hide');
  $("#countries-list").empty();
}

mapboxgl.accessToken = 'pk.eyJ1IjoiaG90IiwiYSI6ImNsdG40NWV0ZTAycG4ya283M3JlZW95Z2YifQ.bSVR79K7l2_98DxiCqO1-Q';
var map = new mapboxgl.Map({
  container: 'map',
  logoPosition: 'top-left',
  // scrollZoom: false,
  // dragRotate: false,
  maxZoom: 18,
  minZoom: 1.25,
  zoom: 1.25,
  center: [0, 8],
  style: 'mapbox://styles/hot/cjepk5hhz5o9w2rozqj353ut4',
  attributionControl: false
})
  .addControl(new mapboxgl.AttributionControl({ compact: false }));

map.on('load', function () {
  $('#loading-map').detach();

  map.addSource('countriesbetter', {
    "type": "vector",
    "url": "mapbox://hot.6w45pyli"
  });

  map.addLayer({
    "id": "project_countries",
    "type": "fill",
    "source": "countriesbetter",
    "source-layer": "countries-polygon-7jl2br",
    "minzoom": 0,
    "maxzoom": 8,
    "filter": ['in', 'name_low'].concat(projectCountries),
    "paint": {
      "fill-pattern": "lines-red-4",
      "fill-outline-color": "#EFB4B4"
    }
  }, 'place-city-sm');

var framesPerSecond = 2;
var multiplier = 0.01;
var opacity = .1;
var circleRadius = 3;

function pulseMarker(timestamp){
  setTimeout(function() {
    requestAnimationFrame(pulseMarker)
    multiplier += .1;
    opacity -= ( .3 / framesPerSecond );
    circleRadius += ( 1 / framesPerSecond );
    if (opacity <= 0) {
      opacity = 1;
      circleRadius = 3;
    }
  }, 1000 / framesPerSecond );
}

pulseMarker(0);

})
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

  map.on('click', function(e) {
    var features = map.queryRenderedFeatures(
      [e.point.x, e.point.y],
      {layers: ['project_countries']}
    );
    if (features.length) {
      var country_name = features[0].properties.name_low.split(' ').join('-');
      $(location).attr('href', '/where-we-work/' + country_name);
    }
  });

  map.on('click', function(e) {
    var features = map.queryRenderedFeatures(
      [e.point.x, e.point.y],
      {layers: ['all-projects-symbol', 'all-projects-black-circle', 'all-projects-edits-circle']}
    );
    if (features.length) {

    }
  });

  var lastCountry;
  map.on('mousemove', function(e) {
    if (currentTab === 'country-map'){
      var areaHover = map.queryRenderedFeatures(
        e.point,
        {layers: ['project_countries']}
      );
      if (areaHover.length) {
        map.getCanvas().style.cursor = 'pointer';
        if (lastCountry !== areaHover[0].properties.NAME_LONG) {
          $("#hover-details").empty();
          $("#hover-details").removeClass('hide');
          $("#hover-details").append(
            '<p class="hover-name">' + areaHover[0].properties.NAME_LONG + '</p>' +
            '<p>Click on the country to see the details</p>'
          );
          lastCountry = areaHover[0].properties.NAME_LONG;
        }
      } else {
        map.getCanvas().style.cursor = '';
        lastCountry = '';
        $("#hover-details").empty();
        $("#hover-details").addClass('hide');
      }
    } else {
      var projectHover = map.queryRenderedFeatures(
        e.point,
        {layers: ['all-projects-symbol', 'all-projects-black-circle', 'all-projects-edits-circle']}
      );
      if (projectHover.length){
        map.getCanvas().style.cursor = 'pointer';
        $("#hover-details").empty();
        $("#hover-details").removeClass('hide');
        $("#hover-details").append(
          '<p class="hover-name">' +
          '<a target="_blank" href="https://tasks.hotosm.org/projects/' +
          projectHover[0].properties.id +
          '">#' + projectHover[0].properties.id +'</a>' +
           " - " +
          projectHover[0].properties.title + '</p>' +
          '<p class= "hover-edits">' + formatedData(projectHover[0].properties.edits) + ' Edits </p>'
        );
        console.log()
        var coordinates = projectHover[0].geometry.coordinates.slice();
        var description = "<html><h6><a target='_blank' href='https://tasks.hotosm.org/projects/" + projectHover[0].properties.id
                          + "'</a>#" + projectHover[0].properties.id + " - "
                          + projectHover[0].properties.title + "</h6></html>";
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // popup.setLngLat(coordinates)
        //     .setHTML(description)
        //     .addTo(map);

      } else {
        map.getCanvas().style.cursor = '';
        // $("#hover-details").empty();
        // $("#hover-details").addClass('hide');
        // popup.remove();
      }
    }
  });

map.on('mousemove', 'all-projects-clusters', function (e) {
  $("#hover-details").empty();
  $("#hover-details").removeClass('hide');
  $("#hover-details").append(
    '<p class="hover-name">'+ e.features[0].properties.point_count + ' tasking manager projects</p>' +
    '<p>Zoom in to explore projects in the cluster</p>'
 );
});

var fullMap = false;

function expandMap() {
  if (fullMap) {
    map.scrollZoom.disable();
    $('.project-index-header').removeClass('hidden');
    $('.mapboxgl-ctrl').addClass('hide');
    $('#regions-select').addClass('hidden');
  } else {
    map.scrollZoom.enable();
    $('.project-index-header').addClass('hidden');
    $('.home-highlights-wrapper').addClass('right');
    $('.home-highlights-wrapper').addClass('right');
    $('.mapboxgl-ctrl').removeClass('hide');
    $('#regions-select').removeClass('hidden');
  }
  fullMap = !fullMap;
}

function countryTabSwitch(evt, tabName) {
  currentTab = tabName;
  evt.currentTarget.className += ' active';
  var countryLayers = ['project_countries'];
  var countryLegends = ['prefix-legend', 'projects-legend', 'active-legend'];
  var projectLegends = ['cluster-legend', 'tm-legend'];
  tablinks = document.getElementsByClassName('tablinks');
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '');
  }
  evt.currentTarget.className += ' active';
  if (tabName === 'project-map') {
    $("#hover-details").empty();
    $("#hover-details").addClass('hide');
    $('#expand-collapse').removeClass('hide');
    for (let i =0; i<projectLegends.length; i++){
      $('#'+projectLegends[i]).removeClass('hide');
    }
    for (let i =0; i<countryLegends.length; i++){
      $('#'+countryLegends[i]).addClass('hide');
    }
    for (let j=0; j< countryLayers.length; j++) {
      map.setLayoutProperty(countryLayers[j], 'visibility', 'none')
    }
  } else if (tabName === 'country-map') {
    $("#hover-details").empty();
    $("#hover-details").addClass('hide');
    $('#expand-collapse').addClass('hide');
    for (let i =0; i<countryLegends.length; i++){
      $('#'+countryLegends[i]).removeClass('hide');
    }
    for (let j=0; j< countryLayers.length; j++) {
      map.setLayoutProperty(countryLayers[j], 'visibility', 'visible')
    }}
}
