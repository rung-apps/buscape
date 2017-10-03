import { create } from 'rung-sdk';
import { Double, String as Text } from 'rung-sdk/dist/types';
import Bluebird from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import {
    filter,
    map,
    mergeAll,
    replace
} from 'ramda';

const request = promisifyAgent(agent, Bluebird);

const token = '----------MY-TOKEN----------';
const sourceId = '----------MY-SOURCE-ID----------';
const url = `https://sandbox-api.lomadee.com/v2/${token}/product/_search?sourceId=${sourceId}`;

const styles = {
    container: {
        fontFamily: 'Roboto, sans-serif',
        textAlign: 'center',
        fontSize: '12px'
    },
    imageContainer: {
        float: 'left',
        marginRight: '2px',
        marginLeft: '-4px',
        position: 'absolute'
    },
    contentContainer: {
        float: 'right',
        width: '89px',
        marginTop: '6px',
        wordWrap: 'break-word'
    },
    thumbnail: {
        padding: '3px',
        backgroundColor: 'white',
        border: '3px solid silver',
        borderRadius: '30px',
        marginTop: '20px'
    },
    price: {
        marginTop: '17px',
        fontWeight: 'bold'
    }
};

function render(picture, product, price) {
    return (
        <div style={ styles.container }>
            <div style={ styles.imageContainer }>
                <img src={ picture } height={ 45 } draggable={ false } style={ styles.thumbnail } />
            </div>
            <div style={ styles.contentContainer }>
                { product }
                <div style={ styles.price }>R$ { price }</div>
            </div>
        </div>
    );
}

function createAlert({ id, shortname, name, priceMin, thumbnail }) {
    const product = shortname || name;
    const thumbnailUrl = replace('http://', 'https://', thumbnail.url);

    return {
        [id]: {
            title: _('{{product}} to R$ {{priceMin}}', { product, priceMin }),
            content: render(thumbnailUrl, product, priceMin),
            comment: `
                ### ${name}

                **R$ ${priceMin}**

            `,
            resources: [thumbnailUrl]
        }

    };
}

function main(context, done) {
    const { item, value } = context.params;

    return request.get(url)
        .query({ keyword: item, sort: 'price' })
        .then(({ body }) => {
            const products = filter(
                item => item.priceMax < value,
                body.products
            ) || [];
            done({ alerts: mergeAll(
                map(createAlert, products)
            ) });
        })
        .catch(() => done({ alerts: {} }));
}

const params = {
    item: {
        description: _('Enter the product you are looking for (Ex: TV)'),
        type: Text,
        default: 'TV'
    },
    value: {
        description: _('The value of the product must be less than'),
        type: Double,
        default: 500.00
    }
};

export default create(main, {
    params,
    primaryKey: true,
    title: _('Lower prices in Buscapé'),
    description: _('Find the lowest prices for the product you want, integrating directly with Buscapé'),
    preview: render(
        'https://thumbs.buscape.com.br/tv/philco-ph16d10d-16-polegadas-led-plana_200x200-PU9760f_1.jpg',
        'Philco 16" LED',
        '499.90'
    )
});
