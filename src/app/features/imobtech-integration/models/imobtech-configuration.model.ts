export enum ModoImobtech {
  Homologacao = 0,
  Producao = 1
}

export interface ImobtechConfiguration {
  habilitado: boolean;
  modo: ModoImobtech;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
}

export interface ImobtechConfigurationResponse {
  habilitado: boolean;
  modo: ModoImobtech;
  clientId?: string;
  username?: string;
}
