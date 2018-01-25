import DataLoader from "dataloader";

export const BuildDataLoaders = ({ Pokemon }) => ({
  pokemon: new DataLoader(keys => keys)
});
