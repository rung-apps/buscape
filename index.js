import { create } from 'rung-sdk';
import { Money, String as Text } from 'rung-sdk/dist/types';
import Bluebird from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import { head, map, pipe, prop } from 'ramda';

const request = promisifyAgent(agent, Bluebird);

const token = '6c6f4f354d436e774638733d';
const sourceId = '22491686';
const url = `http://sandbox.buscape.com.br/service/findProductList/lomadee/${token}/BR/?sourceId=${sourceId}&app-token=${token}&format=json&program=lomadee`;

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

function createAlert({ productshortname, productname, pricemin, links, thumbnail }) {
    const { url } = head(links).link;
    const { url: picture } = thumbnail;

    return {
        title: _('{{productshortname}} to R$ {{pricemin}}', { productshortname, pricemin }),
        content: (
            <div style={ styles.container }>
                <div style={ styles.imageContainer }>
                    <img src={ picture } height={ 45 } draggable={ false } style={ styles.thumbnail } />
                </div>
                <div style={ styles.contentContainer }>
                    { productshortname }
                    <div style={ styles.price }>R$ { pricemin }</div>
                </div>
            </div>
        ),
        comment: `
            ### ${productname}

            **R$ ${pricemin}**

            [${_('Click here to open in Buscapé')}](${url})

            ![${productname}](${picture})
        `
    };
}

function main(context, done) {
    const { item: keyword, value: priceMax } = context.params;

    return request.get(url)
        .query({ keyword, priceMax })
        .then(({ body }) => {
            const products = body.product || [];
            const alerts = map(pipe(prop('product'), createAlert), products);
            done({ alerts });
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
        type: Money,
        default: 500
    }
};

export default create(main, { params });
