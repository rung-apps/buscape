import { create } from 'rung-sdk';
import { AutoComplete, Double } from 'rung-cli/dist/types';
import Bluebird, { reject } from 'bluebird';
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
const productionUrl = `https://api.lomadee.com/v2/${productionToken}/product/_search`;

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

function createAlert({ id, shortname, name, priceMin, /* link, */ thumbnail }) {
    const product = shortname || name;
    const thumbnailUrl = replace('http://', 'https://', thumbnail.url);
    const productUrl = `http://www.buscape.com.br/${name.replace(/ /g, '-')}`;

    return {
        [id]: {
            title: _('{{product}} to R$ {{priceMin}}', { product, priceMin }),
            content: render(thumbnailUrl, product, priceMin),
            comment: `
            ### ${name}

            **R$ ${priceMin}**

            [${_('Click here to open in Buscapé')}](${productUrl})
            `,
            resources: [thumbnailUrl]
        }

    };
}

function main(context) {
    const { item: keyword, value } = context.params;
    const query = { sourceId, keyword, sort: 'price', size: 24 };
    const getProducts = products => filter(
        item => item.priceMax < value && item.hasOffer > 0,
        products || []
    );

    return request
        .get(productionUrl)
        .query(query)
        .then(({ body }) => {
            return body.requestInfo.status === 'OK'
                ? { alerts: mergeAll(map(createAlert, getProducts(body.products))) }
                : reject(new Error(_('Product not found')));
        })
        .catch(() => reject(new Error(_('Product not found'))));
}

const params = {
    item: {
        description: _('Enter the product you are looking for (Ex: TV)'),
        type: AutoComplete,
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
    description: _('Compare the price of one or more products across multiple sites and find the ideal opportunity to acquire them.'),
    preview: render(
        'https://thumbs.buscape.com.br/tv/philco-ph16d10d-16-polegadas-led-plana_200x200-PU9760f_1.jpg',
        'Philco 16" LED',
        '499.90'
    )
});
