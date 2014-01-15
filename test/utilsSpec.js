define(['utils'], function (Utils) {

    describe('Slicing...', function () {
        var array = [3, 1, 2];
        expect(Utils.slice(array)).to.eql([3, 1, 2]);
        expect(Utils.slice(array, 1)).to.eql([1, 2]);
        expect(Utils.slice(array, 1, 2)).to.eql([1]);
        expect(Utils.slice(array, 2, 3)).to.eql([2]);
        expect(Utils.slice(array, 0, 1)).to.eql([3]);
        expect(Utils.slice(array, 0, -1)).to.eql([3, 1]);
        expect(Utils.slice(array, 0, -2)).to.eql([3]);
    });

    describe('Obtaining object keys...', function () {
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

    describe('"Eaching" arrays...', function () {
        var result = [];
        Utils.each([3, 1, 2], function (element, index, array) {
            expect(array).to.eql([3, 1, 2]);
            result.push(element * index);
        });
        expect(result).to.eql([0, 1, 4]);
    });

    describe('"Eaching" objects...', function () {
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