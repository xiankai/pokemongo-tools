import matchGyms from './match_gyms';

const generateTestCase = (gyms, exraids_combined, outputProperties) => {
    expect(JSON.parse(matchGyms({
        gyms,
        exraids_combined,
    }))).toHaveProperty('features',
            outputProperties.map(property => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [0, 0],
                },
                properties: {
                    ...property,
                    terrains: [],
                }
            }))
        );
}

describe('legacy gyms', () => {
    const sampleGyms = [
        ['normal', 0, 0],
        ['obsolete', 0, 0, 'Obsolete'],
        ['superceded', 0, 0, 'new'],
        ['new', 0, 0],
        ['superceded once', 0, 0, 'superceded twice'],
        ['superceded twice', 0, 0, 'really new'],
        ['really new', 0, 0],
    ];

    const sampleRaids = {
        'normal': [1],
        'obsolete': [2],
        'superceded': [3],
        'new': [4],
        'superceded once': [5],
        'superceded twice': [6],
        'really': [7],
    }

    it('parse normally', () => {
        generateTestCase([
            ['normal', 0, 0],
        ], {
            'normal': [1],
        }, [
            {
                name: 'normal',
                dates: [1],
                supercededBy: '',
            }
        ])
    });

    it('obsolete gym', () => {
        generateTestCase([
            ['normal', 0, 0],
            ['obsolete', 0, 0, 'Obsolete'],
        ], {
            'normal': [1],
        }, [
            {
                name: 'normal',
                dates: [1],
                supercededBy: '',
            },
            {
                name: 'obsolete',
                dates: [],
                supercededBy: 'Obsolete',
            }
        ])
    });

    it('obsolete gym with a successor', () => {
        generateTestCase([
            ['normal', 0, 0],
            ['obsolete', 0, 0, 'normal'],
        ], {
            'normal': [1],
        }, [
            {
                name: 'normal',
                dates: [1],
                supercededBy: '',
            },
            {
                name: 'obsolete',
                dates: [],
                supercededBy: 'normal',
            }
        ])
    });
});
