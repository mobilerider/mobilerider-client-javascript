describe('Slicing...', function () {

    it('should slice...', function () {
        var array = [3, 1, 2];
        expect(Utils.slice(array)).to.eql([3, 1, 2]);
        expect(Utils.slice(array, 1)).to.eql([1, 2]);
        expect(Utils.slice(array, 1, 2)).to.eql([1]);
        expect(Utils.slice(array, 2, 3)).to.eql([2]);
        expect(Utils.slice(array, 0, 1)).to.eql([3]);
        expect(Utils.slice(array, 0, -1)).to.eql([3, 1]);
        expect(Utils.slice(array, 0, -2)).to.eql([3]);
    });
});

describe('Obtaining object keys...', function () {

    it('should get the keys', function () {
        // We can't expect an specific order in these tests
        var keys = Utils.keys({a: 3, b: 1, c: 2});
        expect(keys).to.contain('a');
        expect(keys).to.contain('b');
        expect(keys).to.contain('c');
        expect(keys).to.have.length(3);

        keys = Utils.keys({3: 'a', 1: 'b', 2: 'c'});
        expect(keys).to.contain('3');
        expect(keys).to.contain('1');
        expect(keys).to.contain('2');
        expect(keys).to.have.length(3);
    });
});

describe('"Eaching" arrays...', function () {

    it('should iterate arrays...', function () {
        var result = [];
        Utils.each([3, 1, 2], function (element, index, array) {
            expect(array).to.eql([3, 1, 2]);
            result.push(element * index);
        });
        expect(result).to.eql([0, 1, 4]);
    });
});

describe('"Eaching" objects...', function () {

    it('should iterate objects keys/values...', function () {
        var keys = [], values = [];
        Utils.each(
            {a: 3, b: 1, c: 2},
            function (value, key, obj) {
                expect(obj).to.eql({a: 3, b: 1, c: 2});
                values.push(value * 2);
                keys.push(key + '_key');
            }
        );
        expect(keys).to.eql(['a_key', 'b_key', 'c_key']);
        expect(values).to.eql([6, 2, 4]);
    });
});

describe('#isArray', function () {

    it('test positive for proper arrays', function () {
        expect(Utils.isArray([])).to.be.ok;
        expect(Utils.isArray([1])).to.be.ok;
        expect(Utils.isArray(['a'])).to.be.ok;
    });

    it('test negative for proper arrays', function () {
        expect(Utils.isArray({})).not.to.be.ok;
        expect(Utils.isArray(Utils)).not.to.be.ok;
        expect(Utils.isArray(1)).not.to.be.ok;
        expect(Utils.isArray('a')).not.to.be.ok;
    });
});

describe('#any', function () {

    it('should find the first and only the first occurrence of a value that passes the test', function () {
        var count = 0, found = Utils.any([1, 2, 3, 4, 5], function (value) {
            count += 1;
            return value > 3;
        });
        expect(found).to.be.ok;
        expect(count).to.eql(4);
    });

    it('should return `false` for `null`, `undefined` and `false` values', function () {
        var called = false;
        expect(Utils.any(null, function (value) {
            called = true;
            return true;
        })).to.not.be.ok;
        expect(called).to.not.be.ok;

        called = false;
        expect(Utils.any(void 0, function (value) {
            called = true;
            return true;
        })).to.not.be.ok;
        expect(called).to.not.be.ok;

        called = false;
        expect(Utils.any(false, function (value) {
            called = true;
            return true;
        })).to.not.be.ok;
        expect(called).to.not.be.ok;
    });
});

describe('#map', function () {
    it('should double each element of the collection', function () {
        var count = 0, doubled = Utils.map([1, 2, 3, 4, 5], function (value) {
            count += 1;
            return value * 2;
        });
        expect(doubled).to.eql([2, 4, 6, 8, 10]);
        expect(count).to.eql(5);
    });

    it('should return the same array when omitting the iterator', function () {
        expect(Utils.map([1, 3, 5, 7, 11, 13])).to.eql([1, 3, 5, 7, 11, 13]);
        expect(Utils.map(['1', '3', '5', '7', '11', '13'])).to.eql(['1', '3', '5', '7', '11', '13']);
    });

    it('should return an empty array for `null`, `undefined` and `false` values', function () {
        var mapped;

        mapped = Utils.map(false);
        expect(mapped).to.eql([]);
        expect(mapped).to.be.an('Array');
        expect(mapped).to.have.length(0);

        mapped = Utils.map(void 0);
        expect(mapped).to.eql([]);
        expect(mapped).to.be.an('Array');
        expect(mapped).to.have.length(0);

        mapped = Utils.map(null);
        expect(mapped).to.eql([]);
        expect(mapped).to.be.an('Array');
        expect(mapped).to.have.length(0);
    });
});
