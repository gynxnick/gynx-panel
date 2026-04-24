import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto`};

    & > div {
        ${tw`flex items-center text-sm mx-auto px-6`};
        max-width: 1440px;

        & > a,
        & > div {
            ${tw`inline-flex items-center py-3 px-4 text-gynx-text-dim no-underline whitespace-nowrap relative`};
            font-weight: 500;
            letter-spacing: 0.01em;
            transition: color .2s ease;

            &:not(:first-of-type) {
                ${tw`ml-1`};
            }

            &:hover {
                color: #fff;
            }

            &:active,
            &.active {
                color: #fff;
            }

            &.active::after {
                content: '';
                position: absolute;
                left: 16px;
                right: 16px;
                bottom: 0;
                height: 2px;
                border-radius: 2px;
                background: linear-gradient(90deg, #7C3AED, #22D3EE);
                box-shadow: 0 0 14px rgba(124, 58, 237, 0.7);
            }
        }
    }
`;

export default SubNavigation;
