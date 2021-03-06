goog.require('gmf.displayquerygridDirective');
goog.require('ol.Map');
goog.require('ngeo.GridConfig');

/**
 * Compare two list of objects using only the properties of the expected objects.
 * For example to ignore 'closure_uid_*'.
 */
var compareGridData = function(data, expectedData) {
  expect(data.length).toBe(expectedData.length);
  for (var i = 0; i < data.length; i++) {
    expect(data[i]).toEqual(jasmine.objectContaining(expectedData[i]));
  }
};


describe('gmf.displayquerygridDirective', function() {

  var queryGridController;
  var ngeoQueryResult;
  var $scope;
  var $rootScope;
  var $timeout;

  beforeEach(function() {
    module('ngeo', function($provide) {
      $provide.value('ngeoQueryOptions', {});
    });

    inject(function($injector, _$controller_, _$rootScope_) {
      ngeoQueryResult = $injector.get('ngeoQueryResult');
      $timeout = $injector.get('$timeout');
      var $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      var data = {
        featuresStyleFn: function() {
          return new ol.style.Style();
        },
        selectedFeatureStyleFn: function() {
          return undefined;
        },
        getMapFn: function() {
          return new ol.Map({
            view: new ol.View({
              center: [0, 0],
              zoom: 0
            })
          });
        }
      };
      queryGridController = $controller(
          'GmfDisplayquerygridController', {$scope: $scope}, data);
      $rootScope.$digest();
    });
  });

  describe('#updateData_', function() {

    it('deals with no sources', function() {
      ngeoQueryResult.total = 0;
      ngeoQueryResult.sources = [];
      $rootScope.$digest();
      expect(queryGridController.active).toBe(false);
    });

    it('deals with a single source', function() {
      ngeoQueryResult.total = 2;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A',
            'empty_column': undefined
          }),
          new ol.Feature({
            'osm_id': 12345,
            'name': 'B',
            'empty_column': undefined
          })
        ],
        id: 123,
        label: 'Test',
        pending: false,
        queried: true
      }];
      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);
      expect(queryGridController.selectedTab).toBe(123);

      var featuresForSource = queryGridController.featuresForSources_['123'];
      expect(Object.keys(featuresForSource).length).toBe(2);

      var gridSource = queryGridController.gridSources['123'];
      expect(gridSource).toBeDefined();

      var gridConfig = gridSource.configuration;
      var expectedGridData = [
        {
          'osm_id': 1234,
          'name': 'A',
          'empty_column': undefined
        },
        {
          'osm_id': 12345,
          'name': 'B',
          'empty_column': undefined
        }
      ];
      compareGridData(gridConfig.data, expectedGridData);

      var expectedColumnDefs = [
        {'name': 'osm_id'},
        {'name': 'name'},
        {'name': 'empty_column'}
      ];
      expect(gridConfig.columnDefs).toEqual(expectedColumnDefs);
    });

    it('removes empty columns', function() {
      queryGridController.removeEmptyColumns_ = true;

      ngeoQueryResult.total = 2;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A',
            'empty_column': undefined
          }),
          new ol.Feature({
            'osm_id': 12345,
            'name': 'B',
            'empty_column': undefined
          })
        ],
        id: 123,
        label: 'Test',
        pending: false,
        queried: true
      }];
      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);

      var gridSource = queryGridController.gridSources['123'];
      expect(gridSource).toBeDefined();

      var gridConfig = gridSource.configuration;
      var expectedGridData = [
        {
          'osm_id': 1234,
          'name': 'A'
        },
        {
          'osm_id': 12345,
          'name': 'B'
        }
      ];
      compareGridData(gridConfig.data, expectedGridData);

      var expectedColumnDefs = [
        {'name': 'osm_id'},
        {'name': 'name'}
      ];
      expect(gridConfig.columnDefs).toEqual(expectedColumnDefs);
    });

    it('does not create a grid if only empty columns', function() {
      queryGridController.removeEmptyColumns_ = true;

      ngeoQueryResult.total = 2;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'empty_column': undefined,
            '2n-empty_column': undefined
          }),
          new ol.Feature({
            'empty_column': undefined,
            '2n-empty_column': undefined
          })
        ],
        id: 123,
        label: 'Test',
        pending: false,
        queried: true
      }];
      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(false);

      var gridSource = queryGridController.gridSources['123'];
      expect(gridSource).toBeUndefined();
    });

    it('deals with multiple sources', function() {
      ngeoQueryResult.total = 3;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A'
          }),
          new ol.Feature({
            'osm_id': 12345,
            'name': 'B'
          })
        ],
        id: 123,
        label: 'Test 1',
        pending: false,
        queried: true
      }, {
        features: [],
        id: 234,
        label: 'Test 2',
        pending: false,
        queried: true
      }, {
        features: [
          new ol.Feature({
            'id': 1234,
            'label': 'C'
          })
        ],
        id: 345,
        label: 'Test 3',
        pending: false,
        queried: true
      }];
      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);

      // grid source 1
      var gridSource1 = queryGridController.gridSources['123'];
      expect(gridSource1).toBeDefined();

      var gridConfig1 = gridSource1.configuration;
      var expectedGridData1 = [
        {
          'osm_id': 1234,
          'name': 'A'
        },
        {
          'osm_id': 12345,
          'name': 'B'
        }
      ];
      compareGridData(gridConfig1.data, expectedGridData1);

      var expectedColumnDefs1 = [
        {'name': 'osm_id'},
        {'name': 'name'}
      ];
      expect(gridConfig1.columnDefs).toEqual(expectedColumnDefs1);

      // grid source 2
      var gridSource2 = queryGridController.gridSources['234'];
      expect(gridSource2).not.toBeDefined();

      // grid source 3
      var gridSource3 = queryGridController.gridSources['345'];
      expect(gridSource3).toBeDefined();

      var gridConfig3 = gridSource3.configuration;
      var expectedGridData3 = [
        {
          'id': 1234,
          'label': 'C'
        }
      ];
      compareGridData(gridConfig3.data, expectedGridData3);

      var expectedColumnDefs3 = [
        {'name': 'id'},
        {'name': 'label'}
      ];
      expect(gridConfig3.columnDefs).toEqual(expectedColumnDefs3);
    });

    it('deals with sources with too many features', function() {
      ngeoQueryResult.total = 2;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A'
          }),
          new ol.Feature({
            'osm_id': 12345,
            'name': 'B'
          })
        ],
        id: 123,
        label: 'Test 1',
        pending: false,
        queried: true
      }, {
        features: [],
        id: 345,
        label: 'Test 3',
        pending: false,
        queried: true,
        tooManyResults: true,
        totalFeatureCount: 351
      }];
      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);

      // grid source 1
      var gridSource1 = queryGridController.gridSources['123'];
      expect(gridSource1).toBeDefined();

      // grid source 2
      var gridSource2 = queryGridController.gridSources['345'];
      expect(gridSource2).toBeDefined();
      expect(gridSource2.configuration).toBe(null);
    });

    it('deals with sources that all have too many features', function() {
      ngeoQueryResult.total = 0;
      ngeoQueryResult.sources = [{
        features: [],
        id: 123,
        label: 'Test 1',
        pending: false,
        queried: true,
        tooManyResults: true,
        totalFeatureCount: 123
      }, {
        features: [],
        id: 345,
        label: 'Test 3',
        pending: false,
        queried: true,
        tooManyResults: true,
        totalFeatureCount: 351
      }];
      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);

      // grid source 1
      var gridSource1 = queryGridController.gridSources['123'];
      expect(gridSource1).toBeDefined();
      expect(gridSource1.configuration).toBe(null);

      // grid source 2
      var gridSource2 = queryGridController.gridSources['345'];
      expect(gridSource2).toBeDefined();
      expect(gridSource2.configuration).toBe(null);
    });

    it('merges sources', function() {
      ngeoQueryResult.total = 4;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A'
          }),
          new ol.Feature({
            'osm_id': 12345,
            'name': 'B'
          })
        ],
        id: 123,
        label: 'Test 1',
        pending: false,
        queried: true
      }, {
        features: [
          new ol.Feature({
            'osm_id': 123456,
            'name': 'C'
          })
        ],
        id: 234,
        label: 'Test 2',
        pending: false,
        queried: true
      }, {
        features: [
          new ol.Feature({
            'id': 1234,
            'label': 'D'
          })
        ],
        id: 345,
        label: 'Test 3',
        pending: false,
        queried: true
      }];

      queryGridController.mergeTabs_ = {
        'merged_source': ['123', '234']
      };

      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);

      // merged source
      var gridSource1 = queryGridController.gridSources['merged_source'];
      expect(gridSource1).toBeDefined();

      var gridConfig1 = gridSource1.configuration;
      var expectedGridData1 = [
        {
          'osm_id': 1234,
          'name': 'A'
        },
        {
          'osm_id': 12345,
          'name': 'B'
        },
        {
          'osm_id': 123456,
          'name': 'C'
        }
      ];
      compareGridData(gridConfig1.data, expectedGridData1);

      var expectedColumnDefs1 = [
        {'name': 'osm_id'},
        {'name': 'name'}
      ];
      expect(gridConfig1.columnDefs).toEqual(expectedColumnDefs1);

      // grid source 3
      var gridSource3 = queryGridController.gridSources['345'];
      expect(gridSource3).toBeDefined();

      var gridConfig3 = gridSource3.configuration;
      var expectedGridData3 = [
        {
          'id': 1234,
          'label': 'D'
        }
      ];
      compareGridData(gridConfig3.data, expectedGridData3);

      var expectedColumnDefs3 = [
        {'name': 'id'},
        {'name': 'label'}
      ];
      expect(gridConfig3.columnDefs).toEqual(expectedColumnDefs3);
    });

    it('merges sources with too many features', function() {
      ngeoQueryResult.total = 4;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A'
          }),
          new ol.Feature({
            'osm_id': 12345,
            'name': 'B'
          })
        ],
        id: 123,
        label: 'Test 1',
        pending: false,
        queried: true
      }, {
        features: [],
        id: 234,
        label: 'Test 2',
        pending: false,
        queried: true,
        tooManyResults: true,
        totalFeatureCount: 351
      }, {
        features: [
          new ol.Feature({
            'id': 1234,
            'label': 'D'
          })
        ],
        id: 345,
        label: 'Test 3',
        pending: false,
        queried: true
      }];

      queryGridController.mergeTabs_ = {
        'merged_source': ['123', '234']
      };

      $rootScope.$digest();
      $timeout.flush();
      expect(queryGridController.active).toBe(true);

      // merged source
      var gridSource1 = queryGridController.gridSources['merged_source'];
      expect(gridSource1).toBeDefined();
      expect(gridSource1.configuration).toBe(null);
      expect(gridSource1.source.tooManyResults).toBe(true);
      expect(gridSource1.source.totalFeatureCount).toBe(353);
      expect(gridSource1.source.features).toEqual([]);

      // grid source 3
      var gridSource3 = queryGridController.gridSources['345'];
      expect(gridSource3).toBeDefined();
    });

  });

  describe('#selectTab', function() {

    beforeEach(function() {
      ngeoQueryResult.total = 5;
      ngeoQueryResult.sources = [{
        features: [
          new ol.Feature({
            'osm_id': 1234,
            'name': 'A'
          })
        ],
        id: 123,
        label: 'Test 1',
        pending: false,
        queried: true
      }, {
        features: [
          new ol.Feature({
            'id': 2345,
            'label': 'C'
          })
        ],
        id: 345,
        label: 'Test 3',
        pending: false,
        queried: true
      }];
      $rootScope.$digest();
      expect(queryGridController.active).toBe(true);
    });

    it('allows to switch between tabs', function() {
      $timeout.flush();
      // check that the first source is selected by default
      expect(queryGridController.selectedTab).toBe(123);
      expect(queryGridController.features_.item(0).get('name')).toBe('A');
      expect(queryGridController.highlightFeatures_.getLength()).toBe(0);

      // select the 2nd source
      queryGridController.selectTab(queryGridController.gridSources['345']);
      expect(queryGridController.selectedTab).toBe(345);
      expect(queryGridController.features_.item(0).get('label')).toBe('C');
      expect(queryGridController.highlightFeatures_.getLength()).toBe(0);
    });

    it('remembers selected rows when switching tabs', function() {
      var gridSource1 = queryGridController.gridSources['123'];
      var row1 = gridSource1.configuration.data[0];
      gridSource1.configuration.selectRow(row1);
      $rootScope.$digest();
      $timeout.flush();

      // check that the first source is selected by default
      expect(queryGridController.selectedTab).toBe(123);
      expect(queryGridController.features_.getLength()).toBe(0);
      expect(queryGridController.highlightFeatures_.item(0).get('name')).toBe('A');

      // select the 2nd source
      queryGridController.selectTab(queryGridController.gridSources['345']);
      expect(queryGridController.selectedTab).toBe(345);
      expect(queryGridController.features_.item(0).get('label')).toBe('C');
      expect(queryGridController.highlightFeatures_.getLength()).toBe(0);

      // and then select again source 1
      queryGridController.selectTab(queryGridController.gridSources['123']);
      expect(queryGridController.selectedTab).toBe(123);
      expect(queryGridController.features_.getLength()).toBe(0);
      expect(queryGridController.highlightFeatures_.item(0).get('name')).toBe('A');
    });
  });
});
