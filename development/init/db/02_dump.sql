--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1 (Debian 16.1-1.pgdg110+1)
-- Dumped by pg_dump version 16.1

-- Started on 2024-02-29 18:46:55 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 16386)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: asset-swissgeol
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO "asset-swissgeol";

--
-- TOC entry 2 (class 3079 OID 16387)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 4715 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 1703 (class 1247 OID 17466)
-- Name: OcrState; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OcrState" AS ENUM (
    'willNotBeProcessed',
    'created',
    'waiting',
    'processing',
    'error',
    'success'
);


ALTER TYPE public."OcrState" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 17479)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: asset-swissgeol
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp(6) with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO "asset-swissgeol";

--
-- TOC entry 223 (class 1259 OID 17485)
-- Name: identities; Type: TABLE; Schema: auth; Owner: asset-swissgeol
--

CREATE TABLE auth.identities (
    id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


ALTER TABLE auth.identities OWNER TO "asset-swissgeol";

--
-- TOC entry 224 (class 1259 OID 17490)
-- Name: instances; Type: TABLE; Schema: auth; Owner: asset-swissgeol
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


ALTER TABLE auth.instances OWNER TO "asset-swissgeol";

--
-- TOC entry 225 (class 1259 OID 17495)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: asset-swissgeol
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    parent character varying(255)
);


ALTER TABLE auth.refresh_tokens OWNER TO "asset-swissgeol";

--
-- TOC entry 226 (class 1259 OID 17500)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: asset-swissgeol
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4716 (class 0 OID 0)
-- Dependencies: 226
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: asset-swissgeol
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 227 (class 1259 OID 17501)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: asset-swissgeol
--

CREATE TABLE auth.schema_migrations (
    version character varying(14) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO "asset-swissgeol";

--
-- TOC entry 228 (class 1259 OID 17504)
-- Name: users; Type: TABLE; Schema: auth; Owner: asset-swissgeol
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp(6) with time zone,
    invited_at timestamp(6) with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp(6) with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp(6) with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp(6) with time zone,
    last_sign_in_at timestamp(6) with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp(6) with time zone,
    updated_at timestamp(6) with time zone,
    phone character varying(15),
    phone_confirmed_at timestamp(6) with time zone,
    phone_change character varying(15) DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp(6) with time zone,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp(6) with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp(6) with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED
);


ALTER TABLE auth.users OWNER TO "asset-swissgeol";

--
-- TOC entry 229 (class 1259 OID 17515)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO "asset-swissgeol";

--
-- TOC entry 230 (class 1259 OID 17522)
-- Name: study_area; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.study_area (
    study_area_id integer NOT NULL,
    asset_id integer NOT NULL,
    geom_quality_item_code text NOT NULL,
    geom public.geometry
);


ALTER TABLE public.study_area OWNER TO "asset-swissgeol";

--
-- TOC entry 231 (class 1259 OID 17527)
-- Name: study_location; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.study_location (
    study_location_id integer NOT NULL,
    asset_id integer NOT NULL,
    geom_quality_item_code text NOT NULL,
    geom public.geometry
);


ALTER TABLE public.study_location OWNER TO "asset-swissgeol";

--
-- TOC entry 232 (class 1259 OID 17532)
-- Name: study_trace; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.study_trace (
    study_trace_id integer NOT NULL,
    asset_id integer NOT NULL,
    geom_quality_item_code text NOT NULL,
    geom public.geometry
);


ALTER TABLE public.study_trace OWNER TO "asset-swissgeol";

--
-- TOC entry 233 (class 1259 OID 17537)
-- Name: all_study; Type: VIEW; Schema: public; Owner: asset-swissgeol
--

CREATE VIEW public.all_study AS
 SELECT study_area.asset_id,
    concat('study_area_', (study_area.study_area_id)::text) AS study_id,
    study_area.study_area_id AS id,
    study_area.geom,
    (study_area.geom OPERATOR(public.=) public.st_centroid(study_area.geom)) AS is_point,
    public.st_astext(public.st_centroid(study_area.geom)) AS centroid_geom_text,
    public.st_astext(study_area.geom) AS geom_text
   FROM public.study_area
UNION ALL
 SELECT study_location.asset_id,
    concat('study_location_', (study_location.study_location_id)::text) AS study_id,
    study_location.study_location_id AS id,
    study_location.geom,
    (study_location.geom OPERATOR(public.=) public.st_centroid(study_location.geom)) AS is_point,
    public.st_astext(public.st_centroid(study_location.geom)) AS centroid_geom_text,
    public.st_astext(study_location.geom) AS geom_text
   FROM public.study_location
UNION ALL
 SELECT study_trace.asset_id,
    concat('study_trace_', (study_trace.study_trace_id)::text) AS study_id,
    study_trace.study_trace_id AS id,
    study_trace.geom,
    (study_trace.geom OPERATOR(public.=) public.st_centroid(study_trace.geom)) AS is_point,
    public.st_astext(public.st_centroid(study_trace.geom)) AS centroid_geom_text,
    public.st_astext(study_trace.geom) AS geom_text
   FROM public.study_trace;


ALTER VIEW public.all_study OWNER TO "asset-swissgeol";

--
-- TOC entry 234 (class 1259 OID 17542)
-- Name: asset; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset (
    asset_id integer NOT NULL,
    title_public text NOT NULL,
    title_original text,
    is_nat_rel boolean NOT NULL,
    receipt_date timestamp(3) without time zone NOT NULL,
    municipality text,
    url text,
    location_analog text,
    processor text,
    last_processed_date timestamp(3) without time zone NOT NULL,
    text_body text,
    sgs_id integer,
    geol_data_info text,
    geol_contact_data_info text,
    geol_aux_data_info text,
    remark text,
    asset_kind_item_code text NOT NULL,
    create_date timestamp(3) without time zone NOT NULL,
    language_item_code text NOT NULL,
    asset_format_item_code text NOT NULL,
    author_biblio_id text,
    source_project text,
    description text,
    is_extract boolean NOT NULL,
    internal_use_id integer NOT NULL,
    public_use_id integer NOT NULL,
    asset_main_id integer
);


ALTER TABLE public.asset OWNER TO "asset-swissgeol";

--
-- TOC entry 235 (class 1259 OID 17547)
-- Name: asset_asset_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.asset_asset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_asset_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4717 (class 0 OID 0)
-- Dependencies: 235
-- Name: asset_asset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.asset_asset_id_seq OWNED BY public.asset.asset_id;


--
-- TOC entry 236 (class 1259 OID 17548)
-- Name: asset_contact; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_contact (
    asset_id integer NOT NULL,
    contact_id integer NOT NULL,
    role text NOT NULL
);


ALTER TABLE public.asset_contact OWNER TO "asset-swissgeol";

--
-- TOC entry 237 (class 1259 OID 17553)
-- Name: asset_file; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_file (
    asset_id integer NOT NULL,
    file_id integer NOT NULL
);


ALTER TABLE public.asset_file OWNER TO "asset-swissgeol";

--
-- TOC entry 238 (class 1259 OID 17556)
-- Name: asset_format_composition; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_format_composition (
    asset_format_composition_id integer NOT NULL,
    asset_id integer NOT NULL,
    asset_format_item_code text NOT NULL
);


ALTER TABLE public.asset_format_composition OWNER TO "asset-swissgeol";

--
-- TOC entry 239 (class 1259 OID 17561)
-- Name: asset_format_composition_asset_format_composition_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.asset_format_composition_asset_format_composition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_format_composition_asset_format_composition_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4718 (class 0 OID 0)
-- Dependencies: 239
-- Name: asset_format_composition_asset_format_composition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.asset_format_composition_asset_format_composition_id_seq OWNED BY public.asset_format_composition.asset_format_composition_id;


--
-- TOC entry 240 (class 1259 OID 17562)
-- Name: asset_format_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_format_item (
    asset_format_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.asset_format_item OWNER TO "asset-swissgeol";

--
-- TOC entry 241 (class 1259 OID 17567)
-- Name: asset_internal_project; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_internal_project (
    asset_id integer NOT NULL,
    internal_project_id integer NOT NULL
);


ALTER TABLE public.asset_internal_project OWNER TO "asset-swissgeol";

--
-- TOC entry 242 (class 1259 OID 17570)
-- Name: asset_kind_composition; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_kind_composition (
    asset_kind_composition_id integer NOT NULL,
    asset_id integer NOT NULL,
    asset_kind_item_code text NOT NULL
);


ALTER TABLE public.asset_kind_composition OWNER TO "asset-swissgeol";

--
-- TOC entry 243 (class 1259 OID 17575)
-- Name: asset_kind_composition_asset_kind_composition_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.asset_kind_composition_asset_kind_composition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_kind_composition_asset_kind_composition_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4719 (class 0 OID 0)
-- Dependencies: 243
-- Name: asset_kind_composition_asset_kind_composition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.asset_kind_composition_asset_kind_composition_id_seq OWNED BY public.asset_kind_composition.asset_kind_composition_id;


--
-- TOC entry 244 (class 1259 OID 17576)
-- Name: asset_kind_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_kind_item (
    asset_kind_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.asset_kind_item OWNER TO "asset-swissgeol";

--
-- TOC entry 245 (class 1259 OID 17581)
-- Name: asset_object_info; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_object_info (
    asset_object_info_id integer NOT NULL,
    file_id integer NOT NULL,
    auto_object_cat_item_code text NOT NULL,
    object_page text NOT NULL,
    object_bbox text NOT NULL,
    object_score text NOT NULL,
    path_to_image text NOT NULL
);


ALTER TABLE public.asset_object_info OWNER TO "asset-swissgeol";

--
-- TOC entry 246 (class 1259 OID 17586)
-- Name: asset_object_info_asset_object_info_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.asset_object_info_asset_object_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asset_object_info_asset_object_info_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4720 (class 0 OID 0)
-- Dependencies: 246
-- Name: asset_object_info_asset_object_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.asset_object_info_asset_object_info_id_seq OWNED BY public.asset_object_info.asset_object_info_id;


--
-- TOC entry 247 (class 1259 OID 17587)
-- Name: asset_publication; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_publication (
    asset_id integer NOT NULL,
    publication_id integer NOT NULL
);


ALTER TABLE public.asset_publication OWNER TO "asset-swissgeol";

--
-- TOC entry 248 (class 1259 OID 17590)
-- Name: asset_user; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_user (
    id uuid NOT NULL,
    role text NOT NULL
);


ALTER TABLE public.asset_user OWNER TO "asset-swissgeol";

--
-- TOC entry 249 (class 1259 OID 17595)
-- Name: asset_user_favourite; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_user_favourite (
    asset_user_id uuid NOT NULL,
    asset_id integer NOT NULL,
    created_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.asset_user_favourite OWNER TO "asset-swissgeol";

--
-- TOC entry 250 (class 1259 OID 17598)
-- Name: asset_x_asset_y; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.asset_x_asset_y (
    asset_x_id integer NOT NULL,
    asset_y_id integer NOT NULL
);


ALTER TABLE public.asset_x_asset_y OWNER TO "asset-swissgeol";

--
-- TOC entry 251 (class 1259 OID 17601)
-- Name: auto_cat; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.auto_cat (
    auto_cat_id integer NOT NULL,
    asset_id integer NOT NULL,
    auto_cat_label_item_code text NOT NULL,
    auto_cat_label_score integer NOT NULL
);


ALTER TABLE public.auto_cat OWNER TO "asset-swissgeol";

--
-- TOC entry 252 (class 1259 OID 17606)
-- Name: auto_cat_auto_cat_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.auto_cat_auto_cat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auto_cat_auto_cat_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4721 (class 0 OID 0)
-- Dependencies: 252
-- Name: auto_cat_auto_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.auto_cat_auto_cat_id_seq OWNED BY public.auto_cat.auto_cat_id;


--
-- TOC entry 253 (class 1259 OID 17607)
-- Name: auto_cat_label_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.auto_cat_label_item (
    asset_cat_label_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.auto_cat_label_item OWNER TO "asset-swissgeol";

--
-- TOC entry 254 (class 1259 OID 17612)
-- Name: auto_object_cat_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.auto_object_cat_item (
    auto_object_cat_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.auto_object_cat_item OWNER TO "asset-swissgeol";

--
-- TOC entry 255 (class 1259 OID 17617)
-- Name: contact; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.contact (
    contact_id integer NOT NULL,
    contact_kind_item_code text NOT NULL,
    name text NOT NULL,
    street text,
    house_number text,
    plz text,
    locality text,
    country text,
    telephone text,
    email text,
    website text
);


ALTER TABLE public.contact OWNER TO "asset-swissgeol";

--
-- TOC entry 256 (class 1259 OID 17622)
-- Name: contact_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.contact_contact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_contact_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4722 (class 0 OID 0)
-- Dependencies: 256
-- Name: contact_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.contact_contact_id_seq OWNED BY public.contact.contact_id;


--
-- TOC entry 257 (class 1259 OID 17623)
-- Name: contact_kind_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.contact_kind_item (
    contact_kind_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.contact_kind_item OWNER TO "asset-swissgeol";

--
-- TOC entry 258 (class 1259 OID 17628)
-- Name: file; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.file (
    file_id integer NOT NULL,
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    file_date timestamp(3) without time zone NOT NULL,
    ocr_status public."OcrState" DEFAULT 'created'::public."OcrState" NOT NULL
);


ALTER TABLE public.file OWNER TO "asset-swissgeol";

--
-- TOC entry 259 (class 1259 OID 17634)
-- Name: file_file_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.file_file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.file_file_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4723 (class 0 OID 0)
-- Dependencies: 259
-- Name: file_file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.file_file_id_seq OWNED BY public.file.file_id;


--
-- TOC entry 260 (class 1259 OID 17635)
-- Name: geom_quality_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.geom_quality_item (
    geom_quality_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.geom_quality_item OWNER TO "asset-swissgeol";

--
-- TOC entry 261 (class 1259 OID 17640)
-- Name: id; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.id (
    id_id integer NOT NULL,
    asset_id integer NOT NULL,
    id text NOT NULL,
    description text NOT NULL
);


ALTER TABLE public.id OWNER TO "asset-swissgeol";

--
-- TOC entry 262 (class 1259 OID 17645)
-- Name: id_id_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.id_id_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.id_id_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4724 (class 0 OID 0)
-- Dependencies: 262
-- Name: id_id_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.id_id_id_seq OWNED BY public.id.id_id;


--
-- TOC entry 263 (class 1259 OID 17646)
-- Name: internal_project; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.internal_project (
    internal_project_id integer NOT NULL,
    name text NOT NULL,
    description text,
    date_delivered text NOT NULL
);


ALTER TABLE public.internal_project OWNER TO "asset-swissgeol";

--
-- TOC entry 264 (class 1259 OID 17651)
-- Name: internal_project_internal_project_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.internal_project_internal_project_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.internal_project_internal_project_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4725 (class 0 OID 0)
-- Dependencies: 264
-- Name: internal_project_internal_project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.internal_project_internal_project_id_seq OWNED BY public.internal_project.internal_project_id;


--
-- TOC entry 265 (class 1259 OID 17652)
-- Name: internal_use; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.internal_use (
    internal_use_id integer NOT NULL,
    is_available boolean NOT NULL,
    status_asset_use_item_code text NOT NULL,
    start_availability_date timestamp(3) without time zone
);


ALTER TABLE public.internal_use OWNER TO "asset-swissgeol";

--
-- TOC entry 266 (class 1259 OID 17657)
-- Name: internal_use_internal_use_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.internal_use_internal_use_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.internal_use_internal_use_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4726 (class 0 OID 0)
-- Dependencies: 266
-- Name: internal_use_internal_use_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.internal_use_internal_use_id_seq OWNED BY public.internal_use.internal_use_id;


--
-- TOC entry 267 (class 1259 OID 17658)
-- Name: language_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.language_item (
    language_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.language_item OWNER TO "asset-swissgeol";

--
-- TOC entry 268 (class 1259 OID 17663)
-- Name: legal_doc; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.legal_doc (
    legal_doc_id integer NOT NULL,
    asset_id integer NOT NULL,
    title text NOT NULL,
    legal_doc_item_code text NOT NULL
);


ALTER TABLE public.legal_doc OWNER TO "asset-swissgeol";

--
-- TOC entry 269 (class 1259 OID 17668)
-- Name: legal_doc_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.legal_doc_item (
    legal_doc_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.legal_doc_item OWNER TO "asset-swissgeol";

--
-- TOC entry 270 (class 1259 OID 17673)
-- Name: legal_doc_legal_doc_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.legal_doc_legal_doc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.legal_doc_legal_doc_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4727 (class 0 OID 0)
-- Dependencies: 270
-- Name: legal_doc_legal_doc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.legal_doc_legal_doc_id_seq OWNED BY public.legal_doc.legal_doc_id;


--
-- TOC entry 271 (class 1259 OID 17674)
-- Name: man_cat_label_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.man_cat_label_item (
    man_cat_label_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.man_cat_label_item OWNER TO "asset-swissgeol";

--
-- TOC entry 272 (class 1259 OID 17679)
-- Name: man_cat_label_ref; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.man_cat_label_ref (
    asset_id integer NOT NULL,
    man_cat_label_item_code text NOT NULL
);


ALTER TABLE public.man_cat_label_ref OWNER TO "asset-swissgeol";

--
-- TOC entry 273 (class 1259 OID 17684)
-- Name: nat_rel_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.nat_rel_item (
    nat_rel_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.nat_rel_item OWNER TO "asset-swissgeol";

--
-- TOC entry 274 (class 1259 OID 17689)
-- Name: pub_channel_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.pub_channel_item (
    pub_channel_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.pub_channel_item OWNER TO "asset-swissgeol";

--
-- TOC entry 275 (class 1259 OID 17694)
-- Name: public_use; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.public_use (
    public_use_id integer NOT NULL,
    is_available boolean NOT NULL,
    status_asset_use_item_code text NOT NULL,
    start_availability_date timestamp(3) without time zone
);


ALTER TABLE public.public_use OWNER TO "asset-swissgeol";

--
-- TOC entry 276 (class 1259 OID 17699)
-- Name: public_use_public_use_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.public_use_public_use_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.public_use_public_use_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4728 (class 0 OID 0)
-- Dependencies: 276
-- Name: public_use_public_use_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.public_use_public_use_id_seq OWNED BY public.public_use.public_use_id;


--
-- TOC entry 277 (class 1259 OID 17700)
-- Name: publication; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.publication (
    publication_id integer NOT NULL,
    pub_channel_item_code text NOT NULL,
    publication_date timestamp(3) without time zone NOT NULL,
    description text NOT NULL,
    link text NOT NULL
);


ALTER TABLE public.publication OWNER TO "asset-swissgeol";

--
-- TOC entry 278 (class 1259 OID 17705)
-- Name: publication_publication_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.publication_publication_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.publication_publication_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4729 (class 0 OID 0)
-- Dependencies: 278
-- Name: publication_publication_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.publication_publication_id_seq OWNED BY public.publication.publication_id;


--
-- TOC entry 279 (class 1259 OID 17706)
-- Name: status_asset_use_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.status_asset_use_item (
    status_asset_use_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.status_asset_use_item OWNER TO "asset-swissgeol";

--
-- TOC entry 280 (class 1259 OID 17711)
-- Name: status_work; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.status_work (
    status_work_id integer NOT NULL,
    asset_id integer NOT NULL,
    status_work_item_code text NOT NULL,
    status_work_date timestamp(3) without time zone NOT NULL,
    processor text
);


ALTER TABLE public.status_work OWNER TO "asset-swissgeol";

--
-- TOC entry 281 (class 1259 OID 17716)
-- Name: status_work_item; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.status_work_item (
    status_work_item_code text NOT NULL,
    geol_code text NOT NULL,
    name text NOT NULL,
    name_de text NOT NULL,
    name_fr text NOT NULL,
    name_rm text NOT NULL,
    name_it text NOT NULL,
    name_en text NOT NULL,
    description text NOT NULL,
    description_de text NOT NULL,
    description_fr text NOT NULL,
    description_rm text NOT NULL,
    description_it text NOT NULL,
    description_en text NOT NULL
);


ALTER TABLE public.status_work_item OWNER TO "asset-swissgeol";

--
-- TOC entry 282 (class 1259 OID 17721)
-- Name: status_work_status_work_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.status_work_status_work_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_work_status_work_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4730 (class 0 OID 0)
-- Dependencies: 282
-- Name: status_work_status_work_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.status_work_status_work_id_seq OWNED BY public.status_work.status_work_id;


--
-- TOC entry 283 (class 1259 OID 17722)
-- Name: study_area_study_area_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.study_area_study_area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.study_area_study_area_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4731 (class 0 OID 0)
-- Dependencies: 283
-- Name: study_area_study_area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.study_area_study_area_id_seq OWNED BY public.study_area.study_area_id;


--
-- TOC entry 284 (class 1259 OID 17723)
-- Name: study_location_study_location_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.study_location_study_location_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.study_location_study_location_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4732 (class 0 OID 0)
-- Dependencies: 284
-- Name: study_location_study_location_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.study_location_study_location_id_seq OWNED BY public.study_location.study_location_id;


--
-- TOC entry 285 (class 1259 OID 17724)
-- Name: study_trace_study_trace_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.study_trace_study_trace_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.study_trace_study_trace_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4733 (class 0 OID 0)
-- Dependencies: 285
-- Name: study_trace_study_trace_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.study_trace_study_trace_id_seq OWNED BY public.study_trace.study_trace_id;


--
-- TOC entry 286 (class 1259 OID 17725)
-- Name: type_nat_rel; Type: TABLE; Schema: public; Owner: asset-swissgeol
--

CREATE TABLE public.type_nat_rel (
    type_nat_rel_id integer NOT NULL,
    asset_id integer NOT NULL,
    nat_rel_item_code text NOT NULL
);


ALTER TABLE public.type_nat_rel OWNER TO "asset-swissgeol";

--
-- TOC entry 287 (class 1259 OID 17730)
-- Name: type_nat_rel_type_nat_rel_id_seq; Type: SEQUENCE; Schema: public; Owner: asset-swissgeol
--

CREATE SEQUENCE public.type_nat_rel_type_nat_rel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.type_nat_rel_type_nat_rel_id_seq OWNER TO "asset-swissgeol";

--
-- TOC entry 4734 (class 0 OID 0)
-- Dependencies: 287
-- Name: type_nat_rel_type_nat_rel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: asset-swissgeol
--

ALTER SEQUENCE public.type_nat_rel_type_nat_rel_id_seq OWNED BY public.type_nat_rel.type_nat_rel_id;


--
-- TOC entry 4312 (class 2604 OID 17731)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 4324 (class 2604 OID 17732)
-- Name: asset asset_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset ALTER COLUMN asset_id SET DEFAULT nextval('public.asset_asset_id_seq'::regclass);


--
-- TOC entry 4325 (class 2604 OID 17733)
-- Name: asset_format_composition asset_format_composition_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition ALTER COLUMN asset_format_composition_id SET DEFAULT nextval('public.asset_format_composition_asset_format_composition_id_seq'::regclass);


--
-- TOC entry 4326 (class 2604 OID 17734)
-- Name: asset_kind_composition asset_kind_composition_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition ALTER COLUMN asset_kind_composition_id SET DEFAULT nextval('public.asset_kind_composition_asset_kind_composition_id_seq'::regclass);


--
-- TOC entry 4327 (class 2604 OID 17735)
-- Name: asset_object_info asset_object_info_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info ALTER COLUMN asset_object_info_id SET DEFAULT nextval('public.asset_object_info_asset_object_info_id_seq'::regclass);


--
-- TOC entry 4328 (class 2604 OID 17736)
-- Name: auto_cat auto_cat_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat ALTER COLUMN auto_cat_id SET DEFAULT nextval('public.auto_cat_auto_cat_id_seq'::regclass);


--
-- TOC entry 4329 (class 2604 OID 17737)
-- Name: contact contact_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact ALTER COLUMN contact_id SET DEFAULT nextval('public.contact_contact_id_seq'::regclass);


--
-- TOC entry 4330 (class 2604 OID 17738)
-- Name: file file_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.file ALTER COLUMN file_id SET DEFAULT nextval('public.file_file_id_seq'::regclass);


--
-- TOC entry 4332 (class 2604 OID 17739)
-- Name: id id_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.id ALTER COLUMN id_id SET DEFAULT nextval('public.id_id_id_seq'::regclass);


--
-- TOC entry 4333 (class 2604 OID 17740)
-- Name: internal_project internal_project_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_project ALTER COLUMN internal_project_id SET DEFAULT nextval('public.internal_project_internal_project_id_seq'::regclass);


--
-- TOC entry 4334 (class 2604 OID 17741)
-- Name: internal_use internal_use_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_use ALTER COLUMN internal_use_id SET DEFAULT nextval('public.internal_use_internal_use_id_seq'::regclass);


--
-- TOC entry 4335 (class 2604 OID 17742)
-- Name: legal_doc legal_doc_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc ALTER COLUMN legal_doc_id SET DEFAULT nextval('public.legal_doc_legal_doc_id_seq'::regclass);


--
-- TOC entry 4336 (class 2604 OID 17743)
-- Name: public_use public_use_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.public_use ALTER COLUMN public_use_id SET DEFAULT nextval('public.public_use_public_use_id_seq'::regclass);


--
-- TOC entry 4337 (class 2604 OID 17744)
-- Name: publication publication_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.publication ALTER COLUMN publication_id SET DEFAULT nextval('public.publication_publication_id_seq'::regclass);


--
-- TOC entry 4338 (class 2604 OID 17745)
-- Name: status_work status_work_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work ALTER COLUMN status_work_id SET DEFAULT nextval('public.status_work_status_work_id_seq'::regclass);


--
-- TOC entry 4321 (class 2604 OID 17746)
-- Name: study_area study_area_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area ALTER COLUMN study_area_id SET DEFAULT nextval('public.study_area_study_area_id_seq'::regclass);


--
-- TOC entry 4322 (class 2604 OID 17747)
-- Name: study_location study_location_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location ALTER COLUMN study_location_id SET DEFAULT nextval('public.study_location_study_location_id_seq'::regclass);


--
-- TOC entry 4323 (class 2604 OID 17748)
-- Name: study_trace study_trace_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace ALTER COLUMN study_trace_id SET DEFAULT nextval('public.study_trace_study_trace_id_seq'::regclass);


--
-- TOC entry 4339 (class 2604 OID 17749)
-- Name: type_nat_rel type_nat_rel_id; Type: DEFAULT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.type_nat_rel ALTER COLUMN type_nat_rel_id SET DEFAULT nextval('public.type_nat_rel_type_nat_rel_id_seq'::regclass);


--
-- TOC entry 4644 (class 0 OID 17479)
-- Dependencies: 222
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: asset-swissgeol
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	9176a1dc-0b48-451c-a8c6-237a01a0c6d4	{"action":"logout","actor_id":"10f95aa3-fb95-41eb-b754-5f729a092e30","actor_username":"admin@swissgeol.assets","log_type":"account"}	2024-02-29 18:43:07.688568+00	
00000000-0000-0000-0000-000000000000	7a180e80-e484-4a00-9948-c05de08d3bc0	{"action":"login","actor_id":"10f95aa3-fb95-41eb-b754-5f729a092e30","actor_username":"admin@swissgeol.assets","log_type":"account","traits":{"provider":"email"}}	2024-02-29 18:43:10.920386+00	
\.


--
-- TOC entry 4645 (class 0 OID 17485)
-- Dependencies: 223
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: asset-swissgeol
--

COPY auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4646 (class 0 OID 17490)
-- Dependencies: 224
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: asset-swissgeol
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4647 (class 0 OID 17495)
-- Dependencies: 225
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: asset-swissgeol
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent) FROM stdin;
00000000-0000-0000-0000-000000000000	1162	PaXdL_ZF_XBdHBtZihuAsg	10f95aa3-fb95-41eb-b754-5f729a092e30	f	2024-02-29 18:43:10.921231+00	2024-02-29 18:43:10.921234+00	\N
\.


--
-- TOC entry 4649 (class 0 OID 17501)
-- Dependencies: 227
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: asset-swissgeol
--

COPY auth.schema_migrations (version) FROM stdin;
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
\.


--
-- TOC entry 4650 (class 0 OID 17504)
-- Dependencies: 228
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: asset-swissgeol
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at) FROM stdin;
00000000-0000-0000-0000-000000000000	10f95aa3-fb95-41eb-b754-5f729a092e30		service_role	admin@swissgeol.assets	$2a$10$oS5YndA5kGTybe8TEl/uDe8BEr.cLhRpytY9dQjntY1YNMv8zfxvq	2024-02-15 16:28:47.224034+00	2024-02-15 16:27:23.057106+00		2024-02-15 16:27:23.057106+00		2024-02-29 18:36:20.170736+00			\N	2024-02-29 18:43:10.921203+00	{"provider": "email", "providers": ["email"]}	{"lang": "de"}	f	2024-02-15 16:27:23.053463+00	2024-02-29 18:43:10.924009+00	\N	\N			\N		0	\N		\N
\.


--
-- TOC entry 4651 (class 0 OID 17515)
-- Dependencies: 229
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bc6d2f10-b62c-4ae1-ae56-5b2be0b2fd79	887e976d868da9e7139edcf0c1b9b34829b83deaf16bc2810d34eb362f25d80b	2023-05-15 07:55:39.679904+00	00_postgis	\N	\N	2023-05-15 07:55:39.606356+00	1
30cac75d-2b65-4140-b22f-8bbddac7c31a	8ed38958c4008b866fa445b1d73e65676d85ee66e257f557baa2a69309235bdc	2023-05-15 07:55:40.254676+00	20230111143745_init	\N	\N	2023-05-15 07:55:39.707888+00	1
642d02ac-9edc-4817-ba87-75ece5cab116	f7e683cb9b7f8b060cec80bafab4339bcb1ede0e95561d2370c9433ce67d4c7d	2023-05-15 07:55:40.381405+00	20230111143746_post-init	\N	\N	2023-05-15 07:55:40.281783+00	1
a0c73e74-fb8f-406d-95c0-49e8b23b22d1	a420bf686dc742c137db016ee40fc6ffcdea31a692d2b13e5f09f923330ad008	2023-05-15 07:55:40.48204+00	20230117130629_favourite	\N	\N	2023-05-15 07:55:40.408558+00	1
f32cd95a-338b-4450-b5bf-0a7a68fb6409	ecd3d5bfc26aad5de4b38f0a1df602904c615651c4a66115741c847a7bd12077	2023-05-15 07:55:40.575853+00	20230329093128_make_some_columns_on_table_asset_nullable	\N	\N	2023-05-15 07:55:40.508574+00	1
1e91a6df-c902-45e2-8f71-94fe2e1dae70	5d89edd597c56ef7af331d0686b3e29517366c115f08c210e09cc6bc841c8262	2023-05-15 07:55:40.687801+00	20230409083312_location_analog_auto_cat	\N	\N	2023-05-15 07:55:40.607546+00	1
f7840704-a48a-4a5b-b3fe-7dd21b53fdf6	e717ff7aa814cc181d76a19885cb59f486e8a7ee228c397b84b2dfda647fe341	2023-05-15 07:55:40.783342+00	20230411131547_original_title	\N	\N	2023-05-15 07:55:40.714157+00	1
3a2493c4-7c42-4688-8074-9e5491e59850	n/a	2023-05-24 08:18:23.847932+00	20230522084603_ocr_status	\N	\N	2023-05-24 08:18:23.847932+00	1
\.


--
-- TOC entry 4655 (class 0 OID 17542)
-- Dependencies: 234
-- Data for Name: asset; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset (asset_id, title_public, title_original, is_nat_rel, receipt_date, municipality, url, location_analog, processor, last_processed_date, text_body, sgs_id, geol_data_info, geol_contact_data_info, geol_aux_data_info, remark, asset_kind_item_code, create_date, language_item_code, asset_format_item_code, author_biblio_id, source_project, description, is_extract, internal_use_id, public_use_id, asset_main_id) FROM stdin;
44382	Erstes	allererstesasset	t	2024-02-06 00:00:00	\N	\N	\N	admin@assets.sg	2024-02-20 15:20:59.111	\N	\N	\N	\N	\N	\N	boreholeProfile	2024-02-13 00:00:00	EN	db	\N	\N	\N	f	130109	130108	\N
\.


--
-- TOC entry 4657 (class 0 OID 17548)
-- Dependencies: 236
-- Data for Name: asset_contact; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_contact (asset_id, contact_id, role) FROM stdin;
\.


--
-- TOC entry 4658 (class 0 OID 17553)
-- Dependencies: 237
-- Data for Name: asset_file; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_file (asset_id, file_id) FROM stdin;
\.


--
-- TOC entry 4659 (class 0 OID 17556)
-- Dependencies: 238
-- Data for Name: asset_format_composition; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_format_composition (asset_format_composition_id, asset_id, asset_format_item_code) FROM stdin;
\.


--
-- TOC entry 4661 (class 0 OID 17562)
-- Dependencies: 240
-- Data for Name: asset_format_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_format_item (asset_format_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
archive	No-GeolCode-specified	Archive	Archive-Format	Format d'archive		Formato d'archivio	Archive format	Archive format resp. compression format, such as zip, tar, gz, bz2 etc.	Archivformat resp. Komprimierungsformat, wie z.B. zip, tar, gz, bz2 etc.	Format d'archivage ou de compression, p. ex. zip, tar, gz, bz2, etc.		Formato d'archivio o formato di compressione, come zip, tar, gz, bz2 ecc.	Archive format resp. compression format, such as zip, tar, gz, bz2 etc.
other	No-GeolCode-specified	Other	Andere	Autres		Altro	Other	Other formats of assets not covered by the values in this list	Andere Formate von Assets, die nicht mit den Werten dieser Liste abgedeckt sind	Autres formats d'assets non couverts par les valeurs de cette liste		Altri formati di elementi non coperti dai valori di questo elenco	Other formats of assets not covered by the values in this list
textAnalog	No-GeolCode-specified	Text analog	Analoge Dokumente (Papier, Mikrofichen etc.)	Documents analogiques (papier, microfiches, etc.)		Documenti analogici (cartaceo, microfiche, ecc.)	Analogue documents (paper, microfiche etc.)	Analogue asset, on e.g. paper, microfiche etc.	Analoges Asset, auf z.B. Papier, Mikrofichen etc.	Asset analogique, p. ex. sur papier, microfiches, etc.		Elemento in formato analogico, ad esempio cartaceo, microfiche, ecc.	Analogue asset, on e.g. paper, microfiche etc.
graphicVector	No-GeolCode-specified	Graphic vector	Digitale Vektorgrafik	Format graphique numérique vectoriel		Grafica digitale vettoriale	Digital vector graphics	Vector graphics format, such as eps, ai, svg etc.	Vektorgrafikformat, wie z.B. eps, ai, svg etc.	Format graphique vectoriel, p. ex. eps, ai, svg, etc.		Formato grafico vettoriale, come eps, ai, svg ecc.	Vector graphics format, such as eps, ai, svg etc.
graphicRaster	No-GeolCode-specified	Graphic raster	Digitale Rastergrafik	Format graphique numérique raster		Grafica digitale raster	Digital raster graphics	Raster graphics format, such as tiff, jpeg, png etc.	Rastergrafikformat, wie z.B. tiff, jpeg, png etc.	Format graphique raster, p. ex. tiff, jpeg, png, etc.		Formato grafico raster, come tiff, jpeg, png ecc.	Raster graphics format, such as tiff, jpeg, png etc.
binary	No-GeolCode-specified	Binary	Digitales binäres Format	Format binaire numérique		Formato binario digitale	Digital binary format	Binary format	Binäres Format	Format binaire		Formato binario	Binary format
textDigital	No-GeolCode-specified	Text digital	Textformat digital	Format texte numérique		Formato testo digitale	Digital text format	Text or ASCII format, such as txt, doc, docx, xls, xlsx, xml, csv etc.	Textformat, wie z.B. txt, doc, docx, xls, xlsx, xml, csv etc.	Format texte, p. ex. txt, doc, docx, xls, xlsx, xml, csv etc.		Formato di testo, come txt, doc, docx, xls, xlsx, xml, csv ecc.	Text or ASCII format, such as txt, doc, docx, xls, xlsx, xml, csv etc.
seismic	No-GeolCode-specified	Seismic	Seismikspezifisches Format	Format spécifique à la sismique		Formato specifico per il sismica	Seismic specific format	Seismic-specific format, such as SPS, SEG2, SEGD, etc.	Seismikspezifisches Format, wie z.B. SPS, SEG2, SEGD etc.	Format spécifique à la sismologie, p. ex. SPS, SEG2, SEGD, etc.		Formato specifico per la sismica, come SPS, SEG2, SEGD, ecc.	Seismic-specific format, such as SPS, SEG2, SEGD, etc.
segy	No-GeolCode-specified	SEGY	SEGY	SEGY		SEGY	SEGY	Seismic-specific format SEGY	Seismikspezifisches Format SEGY	Format spécifique à la sismologie SEGY		Formato specifico sismico SEGY	Seismic-specific format SEGY
segyExported	No-GeolCode-specified	SEGY exported	SEGY exportiert	SEGY exporté		SEGY esportato	SEGY exported	Seismic-specific format SEGY exported	Seismikspezifisches Format SEGY exportiert	Format spécifique à la sismologie SEGY exporté		Formato specifico sismico SEGY esportato	Seismic-specific format SEGY exported
pdf	No-GeolCode-specified	PDF	PDF	PDF		PDF	PDF	Any versions of PDF formats	Jegliche Versionen von PDF-Formaten	Toutes les versions des formats PDF		Qualsiasi versione del formato PDF	Any versions of PDF formats
shapefile	No-GeolCode-specified	Shapefile	Shapefile	Shapefile		Shapefile	Shapefile	ESRI shapefile	ESRI-Shapefile	Shapefile ESRI		Formato ESRI	ESRI shapefile
las	No-GeolCode-specified	LAS	Log ASCII Standard	Log ASCII standard		Log ASCII Standard	Log ASCII Standard	Specific format for well logs, such as log ASCII standard	spezifisches Format für Well-Logs, wie z.B. Log ASCII Standard	Format spécifique pour les logs de forage, p. ex. standard Log ASCII		Formato specifico per i log di perforazione, come ad esempio lo standard ASCII dei log	Specific format for well logs, such as log ASCII standard
unknown	No-GeolCode-specified	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown	Format of the asset not known	Format des Assets nicht bekannt	Format de l'asset non connu		Formato non noto	Format of the asset not known
3D	No-GeolCode-specified	3D	3D-spezifisches Format	Format spécifique à la 3D		Formato specifico per il 3D	3D-specific format	Specific format for 3D models, such as mve, ts, xyz, kml/Collada, OBJ.	spezifisches Format für 3D-Modelle, wie z.B. mve, ts, xyz, kml/Collada, OBJ	Format spécifique pour les modèles 3D, p. ex. mve, ts, xyz, kml/Collada, OBJ		Formato specifico per i modelli 3D, come mve, ts, xyz, kml/Collada, OBJ.	Specific format for 3D models, such as mve, ts, xyz, kml/Collada, OBJ.
db	No-GeolCode-specified	DB	Datenbank	Base de données		Database	Database	Database format, e.g. gpkg, sql, fgdb, mdb	Datenbank-Format, wie z.B. gpkg, sql, fgdb, mdb	Format de base de données, p. ex. gpkg, sql, fgdb, mdb		Formato del database, ad esempio gpkg, sql, fgdb, mdb	Database format, e.g. gpkg, sql, fgdb, mdb
multimedia	No-GeolCode-specified	Multimedia	Multimedia-Format	Format multimédia		Formato multimediale	Multimedia format	Multimedia format, such as MPEG, mp4, mov, avi, wmv.	Multimedia-Format, wie z.B. MPEG, mp4, mov, avi, wmv	Format multimédia, p. ex. MPEG, mp4, mov, avi, wmv		Formato multimediale, come MPEG, mp4, mov, avi, wmv.	Multimedia format, such as MPEG, mp4, mov, avi, wmv.
\.


--
-- TOC entry 4662 (class 0 OID 17567)
-- Dependencies: 241
-- Data for Name: asset_internal_project; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_internal_project (asset_id, internal_project_id) FROM stdin;
\.


--
-- TOC entry 4663 (class 0 OID 17570)
-- Dependencies: 242
-- Data for Name: asset_kind_composition; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_kind_composition (asset_kind_composition_id, asset_id, asset_kind_item_code) FROM stdin;
\.


--
-- TOC entry 4665 (class 0 OID 17576)
-- Dependencies: 244
-- Data for Name: asset_kind_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_kind_item (asset_kind_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
package	No-GeolCode-specified	Asset package	Asset-Paket	Collection d'assets		Raccolta di elementi	Asset package	Collection/package of assets of different types	Sammlung/Paket von Assets verschiedener Arten	Collection/paquet d'assets de différents types		Raccolta di elementi di diverso tipo	Collection/package of assets of different types
other	No-GeolCode-specified	Other	Andere	Autre		Altro	Other	Other types of assets not covered by the values in this list	Andere Arten von Assets, die nicht mit den Werten dieser Liste abgedeckt sind	Autres types d'assets non couverts par les valeurs de cette liste		Altri tipi di elementi non coperti dai valori di questo elenco	Other types of assets not covered by the values in this list
rawData	No-GeolCode-specified	Raw data	Rohdaten	Données brutes		Dati grezzi	Raw data	Raw data	Rohdaten	Données brutes		Dati grezzi	Raw data
report	No-GeolCode-specified	Report	Bericht	Rapport		Rapporto	Report	Geological reports or other documentation of geological investigations	Geologsiche Berichte oder sonstige Dokumentationen von geologischen Untersuchungen	Rapports géologiques ou autres documentations d'études géologiques		Rapporti geologici o altra documentazione di indagini geologiche	Geological reports or other documentation of geological investigations
measurements	No-GeolCode-specified	Measurements	Messungen allgemein	Mesures en général		Misure	Measurements	Any type of measurements, if not further specifiable	Jegliche Arten von Messungen, wenn nicht genauer spezifizierbar	Tout type de mesures, en l'absence d'autres précisions		Qualsiasi tipo di misura, se non ulteriormente specificabile	Any type of measurements, if not further specifiable
log	No-GeolCode-specified	Log	LOG	Log		Log	Log	Borehole log or other log data	Bohr-Log oder andere Log-Daten	Log de forage ou autres données de log		Log di perforazione o altri dati di log	Borehole log or other log data
deviceOutput	No-GeolCode-specified	Device output	Geräteoutput	Données de sortie de l'appareil		Output del dispositivo	Device output	Data output directly from an instrument	Daten, die direkt aus einem Gerät ausgegeben wurden	Données sortant directement d'un appareil		Dati di output ottenuti direttamente da uno strumento	Data output directly from an instrument
manualFieldRecord	No-GeolCode-specified	Manual field record	Feldaufzeichnung	Enregistrement de terrain		Registrazione manuale sul campo	Manual field record	Records made during fieldwork	Aufzeichnungen, die bei der Feldarbeit gemacht wurden	Enregistrements réalisés lors du travail sur le terrain		Registrazioni effettuate durante i lavori sul campo	Records made during fieldwork
labData	No-GeolCode-specified	Lab data	Labormessung	Mesure en laboratoire		Dati di laboratorio	Laboratory data	Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.	Daten, die im Labor erhoben wurden, wie z.B. Kornverteilung, Druckversuche, etc.	Données collectées en laboratoire, p. ex. répartition granulométrique, essais de compression, etc.		Dati raccolti in laboratorio, ad esempio distribuzione granulometrica, prove di pressione, ecc.	Data collected in the laboratory, e.g. grain distribution, compressive strength tests, etc.
map	No-GeolCode-specified	Map	Karte allgemein	Carte en général		Mappa	Map	Any type of maps, if not specifiable	Jegliche Arten von Karten, wenn nicht genauer spezifizierbar	Tout type de carte, en l'absence d'autres précisions		Qualsiasi tipo di mappa, se non specificabile	Any type of maps, if not specifiable
shotpointmap	No-GeolCode-specified	Shotpoint map	Schusspunktkarte	Carte des points de tir		Mappa dei punti di tiro	Shotpoint map	Map of seismic survey shot points	Karte der Schusspunkte bei einer Seismischen Untersuchung	Carte des points de tir lors d'une étude sismique		Mappa dei punti di tiro durante un'indagine sismica	Map of seismic survey shot points
basemap	No-GeolCode-specified	Basemap	Basemap	Carte de base		Mappa di base	Basemap	Base map	Grundkarte	Carte de base		Mappa di base	Base map
wellLocationmap	No-GeolCode-specified	Well location map	Bohrstandortkarte	Carte du site de forage		Mappa della posizione della perforazione	Borehole location map	Map showing locations of one or more boreholes	Karte mit den Standorten von einer oder mehrer Bohrungen	Carte montrant l'emplacement d'un ou de plusieurs forages		Mappa che mostra l'ubicazione di uno o più perforazioni	Map showing locations of one or more boreholes
geologicalMap	No-GeolCode-specified	Geological map	Geologische Karte	Carte géologique		Carta geologica	Geological map	Geological map	Geologische Karte	Carte géologique		Carta geologica	Geological map
location	No-GeolCode-specified	Location	Situationsplan	Plan de situation		Posizione	Location	Site plan,locality plan of an investigation	Situationsplan, Lageplan einer Untersuchung	Plan de situation, plan d'implantation d'une étude		Localizzazone del sito o di un'indagine	Site plan,locality plan of an investigation
crossSection	No-GeolCode-specified	Cross section	Geologischer Profilschnitt	Coupe géologique		Sezione geologica trasversale	Cross section	Geological cross section or profile	Geologische Längen- oder Querprofile	Coupes géologiques longitudinales ou transversales		Profili geologici longitudinali o trasversali	Geological cross section or profile
seismicSection	No-GeolCode-specified	Seismic section	Seismische Section	Section sismique		Sezione sismica	Seismic section	Seismic section	Seismische Sektion	Section sismique		Sezione sismica	Seismic section
drillPath	No-GeolCode-specified	Drill path	Bohrpfad	Trajectoire de forage		Percorso di perforazione	Borehole path	Borehole path: information on the spatial course of the borehole	Bohrpfad: Angaben zum räumlichen Verlauf der Bohrung	Trajectoire de forage : indications sur le tracé spatial du forage		Percorso della perforazione: informazioni sulla traccia della perforazione	Borehole path: information on the spatial course of the borehole
softwareCode	No-GeolCode-specified	Software / code	Software-Code	Code du logiciel		Software / codice	Software / code	Software, script, code/coding	Software, Skript, Code/Codierung	Logiciel, script, code/codage		Software, script, codice	Software, script, code/coding
model	No-GeolCode-specified	Model	Modell	Modèle		Modello	Model	Models, e.g. 3D model, block model, etc.	Modelle, z.B. 3D-Modell, Blocksturzmodell, etc.	Modèles, p. ex. modèle 3D, modèle de chute de blocs, etc.		Modelli, ad esempio modello 3D, modello di scivolamento di blocchi, ecc.	Models, e.g. 3D model, block model, etc.
photo	No-GeolCode-specified	Photo	Foto	Photo		Foto	Photo	Any kind of photos	Jegliche Art von Fotos	Tout type de photos		Qualsiasi tipo di foto	Any kind of photos
seismic3D	No-GeolCode-specified	Seismic 3D	Seismische 3D Untersuchung	Étude sismique 3D		Sismica 3D	Seismic 3D	Data from 3D seismic surveys (3D seismic)	Daten aus 3D-seismischen Untersuchungen (3D-Seismik)	Données d'études sismiques 3D		Dati provenienti da indagini sismiche 3D (sismica 3D)	Data from 3D seismic surveys (3D seismic)
profileSection	No-GeolCode-specified	Profile / section	Profil / Profilschnitt	Profil / Coupe		Profilo / sezione	Profile / section	Any kind of sections or profiles, if not further specifiable	Jegliche Arten von Profilen, wenn nicht genauer spezifizierbar	Tout type de profil ou de coupe, en l'absence d'autres précisions		Qualsiasi tipo di profilo, se non ulteriormente specificabile	Any kind of sections or profiles, if not further specifiable
seismicInterpretation	No-GeolCode-specified	Seismic interpretation	Seismische Interpretation	Interprétation sismique		Interpretazione sismica	Seismic interpretation	Profile with seismic interpretation	Profil mit seismischer Interpretation	Profil avec interprétation sismique		Profilo con interpretazione sismica	Profile with seismic interpretation
boreholeProfile	No-GeolCode-specified	Borehole profile	Bohrprofil	Profil de forage		Profilo della perforazione	Borehole profile	Borehole profile: representation of the drilled layers, layer interpretations and further information on the borehole	Bohrprofil: Darstellung der erbohrten Schichten, Schichtinterpretationen und weiteren Angaben zur Bohrung	Profil de forage : représentation des couches forées, interprétations des couches et autres indications sur le forage.		Profilo della perforazione: rappresentazione degli strati perforati, interpretazione degli strati e ulteriori informazioni sulla perforazione	Borehole profile: representation of the drilled layers, layer interpretations and further information on the borehole
boreholeCompletion	No-GeolCode-specified	Borehole completion	Bohrlochausbau	Aménagement du forage		Completamento della perforazione	Borehole completion	Borehole completion: details of casing, backfill, internals (e.g. piezometer), etc.	Bohrlochausbau: Angaben zu Verrohrung, Hinterfüllung, Einbauten (z.B. Piezometer), etc.	Aménagement du trou de forage : indications sur le tubage, le remblayage, les installations (p. ex. piézomètre), etc.		Completamento dela perforazione: dettagli del tipo di tubatura, del riempimento, dei componenti interni (ad es. piezometro), ecc.	Borehole completion: details of casing, backfill, internals (e.g. piezometer), etc.
configuration	No-GeolCode-specified	configuration	Konfiguration	Configuration		Configurazione	configuration	Configurations of modelling or other calculations	Konfigurationen von Modellierungen oder sonstigen Berechnungen	Configurations de modélisations ou autres calculs		Configurazioni di modellazione o altri calcoli	Configurations of modelling or other calculations
multmedia	No-GeolCode-specified	Multmedia	Multimediadatei	Fichier multimédia		File multimediale	Multmedia	Any type of multimedia files, if not further specifiable.	Jegliche Art von Multimediadateien, wenn nicht genauer spezifizierbar	Tout type de fichier multimédia, en l'absence d'autres précisions		Qualsiasi tipo di file multimediale, se non ulteriormente specificabile.	Any type of multimedia files, if not further specifiable.
video	No-GeolCode-specified	Video	Video	Vidéo		Video	Video	Any type of video	Jegliche Art von Videos	Tout type de vidéos		Qualsiasi tipo di video	Any type of video
unknown	No-GeolCode-specified	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown	Assets whose nature/type is not known	Assets, deren Art/Typ nicht bekannt ist	Assets dont la nature/le type n'est pas connu/e		Attività la cui natura/tipo non è nota	Assets whose nature/type is not known
inSitu	No-GeolCode-specified	In-situ measurment	In-situ Messung	Mesure in situ		Misurazione in situ	In-situ measurement	Any kind of in-situ measurements, such as pump test, well test, etc.	Jegliche Art von In-situ Messungen, wie z.B. Pumpversuch, Well-Test, etc.	Tout type de mesures in situ, p. ex. essai de pompage, test de puits, etc.		Qualsiasi tipo di misurazione in situ, come un test di pompaggio, il test del pozzo, ecc.	Any kind of in-situ measurements, such as pump test, well test, etc.
\.


--
-- TOC entry 4666 (class 0 OID 17581)
-- Dependencies: 245
-- Data for Name: asset_object_info; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_object_info (asset_object_info_id, file_id, auto_object_cat_item_code, object_page, object_bbox, object_score, path_to_image) FROM stdin;
\.


--
-- TOC entry 4668 (class 0 OID 17587)
-- Dependencies: 247
-- Data for Name: asset_publication; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_publication (asset_id, publication_id) FROM stdin;
\.


--
-- TOC entry 4669 (class 0 OID 17590)
-- Dependencies: 248
-- Data for Name: asset_user; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_user (id, role) FROM stdin;
10f95aa3-fb95-41eb-b754-5f729a092e30	admin
\.


--
-- TOC entry 4670 (class 0 OID 17595)
-- Dependencies: 249
-- Data for Name: asset_user_favourite; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_user_favourite (asset_user_id, asset_id, created_at) FROM stdin;
\.


--
-- TOC entry 4671 (class 0 OID 17598)
-- Dependencies: 250
-- Data for Name: asset_x_asset_y; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.asset_x_asset_y (asset_x_id, asset_y_id) FROM stdin;
\.


--
-- TOC entry 4672 (class 0 OID 17601)
-- Dependencies: 251
-- Data for Name: auto_cat; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.auto_cat (auto_cat_id, asset_id, auto_cat_label_item_code, auto_cat_label_score) FROM stdin;
\.


--
-- TOC entry 4674 (class 0 OID 17607)
-- Dependencies: 253
-- Data for Name: auto_cat_label_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.auto_cat_label_item (asset_cat_label_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
energyresources	No-GeolCode-specified	Energy resources	Energierohstoffe	Matières premières énergétiques		Risorse energetiche	Energy resources	Asset on the topic of energy resources (crude oil, natural gas, coal/anthracite)	Asset zum Thema Energierohstoffe (Erdöl, Erdgas, Kohle/Anthrazit)	Asset sur le thème des matières premières énergétiques (pétrole, gaz naturel, charbon/anthracite)		Elemento sul tema delle risorse energetiche (petrolio, gas naturale, carbone/antracite)	Asset on the topic of energy resources (crude oil, natural gas, coal/anthracite)
mining	No-GeolCode-specified	Mining	Bergbau	Exploitation minière		Estrazione mineraria	Mining	Asset on the topic of (historical) mining	Asset zum Thema (historischer) Bergbau	Asset sur le thème de l'exploitation minière (historique)		Elemento sul tema dell'attività mineraria (storica)	Asset on the topic of (historical) mining
mineralressources	No-GeolCode-specified	Mineral ressources	Mineralische Rohstoffe	Matières premières minérales		Materie prime minerali	Mineral resources	Asset on the topic of mineral resources (ores, stone, gravel/sand/clay, etc.)	Asset zum Thema Mineralische Rohstoffe (Erze, Hartstein, Kies/Sand/Ton, etc.)	Asset sur le thème des matières premières minérales (minerais, pierre dure, gravier/sable/argile, etc.)		Elemento sul tema delle risorse minerali (minerali, rocce dure, ghiaia/sabbia/argilla, ecc.)	Asset on the topic of mineral resources (ores, stone, gravel/sand/clay, etc.)
naturalHazards	No-GeolCode-specified	Natural hazards	Naturgefahren	Dangers naturels		Rischi naturali	Natural hazards	Asset on the topic of natural hazards	Asset zum Thema Naturgefahren	Asset sur le thème des dangers naturels		Elemento sul tema dei rischi naturali	Asset on the topic of natural hazards
geothermal	No-GeolCode-specified	Geothermal	Geothermie	Géothermie		Energia geotermica	Geothermal energy	Asset on the topic of geothermal energy	Asset zum Thema Geothermie	Asset sur le thème de la géothermie		Elemento sul tema dell'energia geotermica	Asset on the topic of geothermal energy
measureLabresults	No-GeolCode-specified	Measurements, lab results	Messungen, Laborresultate	Mesures, résultats de laboratoire		Misure, risultati di laboratorio	Measurements, laboratory results	Asset on the topic of measurements and laboratory results	Asset zum Thema Messungen und Laborresultate	Asset sur le thème des mesures et des résultats de laboratoire		Elemento sul tema delle misure e dei risultati di laboratorio	Asset on the topic of measurements and laboratory results
science	No-GeolCode-specified	Science	Wissenschaft	Science		Scienza	Science	Asset on the topic of science	Asset zum Thema Wissenschaft	Asset sur le thème de la science fondamentale		Elemento su temi scientifici non specificati	Asset on the topic of science
geophysics	No-GeolCode-specified	Geophysics	Geophysik	Géophysique		Geofisica	Geophysics	Asset on the topic of geophysics	Asset zum Thema Geophysik	Asset sur le thème de la géophysique		Elemento sul tema della geofisica	Asset on the topic of geophysics
pollution	No-GeolCode-specified	Pollution	Altlasten	Sites contaminés		Siti contaminati	Contaminated sites	Asset on the topic of contaminated sites	Asset zum Thema Altlasten	Asset sur le thème des sites contaminés		Elemento sul tema dei siti contaminati	Asset on the topic of contaminated sites
geologieGeneral	No-GeolCode-specified	Geology general	Geologie allgemein	Géologie en général		Geologia in generale	Geology in general	Asset on the topic of geology in general	Asset zum Thema Geologie allgemein	Asset sur la géologie en général		Elemento sul tema della geologia in generale	Asset on the topic of geology in general
hydrogeology	No-GeolCode-specified	Hydrogeology	Hydrogeologie	Hydrogéologie		Idrogeologia	Hydrogeology	Asset on the topic of hydrogeology	Asset zum Thema Hydrogeologie	Asset sur le thème de l'hydrogéologie		Elemento sul tema dell'idrogeologia	Asset on the topic of hydrogeology
drilling	No-GeolCode-specified	Drilling	Bohrung	Forage		Perforazione	Borehole	Asset on the topic of drilling	Asset zum Thema Bohrungen	Asset sur le thème des forages		Elemento sul tema delle perforazioni	Asset on the topic of drilling
geotechnics	No-GeolCode-specified	Geotechnics	Geotechnik	Géotechnique		Geotecnica	Geotechnics	Asset on the topic of geotechnics (incl. building ground etc.)	Asset zum Thema Geotechnik (inkl. Baugrund etc.)	Asset sur le thème de la géotechnique (y compris sols de fondation, etc.)		Elemento sul tema della geotecnica (incluso il terreno edificabile, ecc.)	Asset on the topic of geotechnics (incl. building ground etc.)
other	No-GeolCode-specified	Other	Andere	Autres		Altro	Other	Asset on other topics not covered by the values in this list	Asset zu anderen Themen, die nicht mit den Werten dieser Liste abgedeckt sind	Asset sur d'autres thèmes qui ne sont pas couverts par les valeurs de cette liste		Elemento su altri argomenti non coperti dai valori di questo elenco	Asset on other topics not covered by the values in this list
\.


--
-- TOC entry 4675 (class 0 OID 17612)
-- Dependencies: 254
-- Data for Name: auto_object_cat_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.auto_object_cat_item (auto_object_cat_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
drillProfile	No-GeolCode-specified	Drill profile	Bohrprofil	Profil de forage		Profilo di perforazione	Borehole profile	Borehole profile	Bohrprofil	Profil de forage		Profilo di perforazione	Borehole profile
stratiSection	No-GeolCode-specified	Strati section	Stratigrafisches Profil	Profil stratigraphique		Profilo stratigrafico	Stratigraphic profile	Stratigraphic profile	Stratigrafisches Profil	Profil stratigraphique		Profilo stratigrafico	Stratigraphic profile
geotechnicSection	No-GeolCode-specified	Geotechnic section	Geotechnisches Profil	Profil géotechnique		Profilo geotecnico	Geotechnical profile	Geotechnical profile	Geotechnisches Profil	Profil géotechnique		Profilo geotecnico	Geotechnical profile
seismicSection	No-GeolCode-specified	Seismic section	Seismisches Profil	Profil sismique		Profilo sismico	Seismic profile	Seismic profile	Seismisches Profil	Profil sismique		Profilo sismico	Seismic profile
wellLog	No-GeolCode-specified	Well log	Bohr-Log	Log de forage		Log di perforazione	Borehole log	Borehole log	Bohr-Log	Log de forage		Log di perforazione	Borehole log
map	No-GeolCode-specified	Map	Karte	Carte		Mappa	Map	Map	Karte	Carte		Mappa	Map
graphic	No-GeolCode-specified	Graphic	Grafik	Graphique		Grafica	Graphic	Graphic	Grafik	Graphique		Grafica	Graphic
table	No-GeolCode-specified	Table	Tabelle	Tableau		Tabella	Table	Table	Tabelle	Tableau		Tabella	Table
photo	No-GeolCode-specified	Photo	Foto	Photo		Foto	Photo	Photo	Foto	Photo		Foto	Photo
geologicalSection	No-GeolCode-specified	Geological Section	Geologisches Profil	Coupe géologique		Profilo geologico	Geological profile	Geological profile	Geologisches Profil	Coupe géologique		Profilo geologico	Geological profile
\.


--
-- TOC entry 4676 (class 0 OID 17617)
-- Dependencies: 255
-- Data for Name: contact; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.contact (contact_id, contact_kind_item_code, name, street, house_number, plz, locality, country, telephone, email, website) FROM stdin;
\.


--
-- TOC entry 4678 (class 0 OID 17623)
-- Dependencies: 257
-- Data for Name: contact_kind_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.contact_kind_item (contact_kind_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
private	No-GeolCode-specified	Private company or private person	Privatfirma oder Privatperson	Entreprise privée ou personne privée		Azienda privata o persona privata	Private company or private person	Private company or private person	Privatfirma oder Privatperson	Entreprise privée ou personne privée		Azienda privata o persona privata	Private company or private person
fedAdmin	No-GeolCode-specified	Federal authority	Bundesbehörde	Autorité fédérale		Autorità federale	Federal authority	Federal authority	Bundesbehörde	Autorité fédérale		Autorità federale	Federal authority
other	No-GeolCode-specified	Other	Andere	Autre		Altro	Other	Other	Andere	Autre		Altro	Other
university	No-GeolCode-specified	University	Universität, Fachhochschule FH	Université, haute école spécialisée HES		Università, Università di Scienze Applicate	University, Vocational University	University and vocational university	Universität und Fachhochschule	Université et haute école spécialisée		Università e scuole universitarie professionali	University and vocational university
community	No-GeolCode-specified	Community	Gemeinde	Commune		Comune	Municipality	Municipality	Gemeinde	Commune		Comune	Municipality
cantonAdmin	No-GeolCode-specified	Cantonal authority	Kantonale Bewilligungsbehörde	Autorité cantonale chargée de délivrer les autorisations		Autorità cantonale di autorizzazione	Cantonal licensing authority	Cantonal authority	Kantonale Behörde	Autorité cantonale		Autorità cantonale	Cantonal authority
swisstopo	No-GeolCode-specified	swisstopo	swisstopo	swisstopo		swisstopo	swisstopo	swisstopo	swisstopo	swisstopo		swisstopo	swisstopo
unknown	No-GeolCode-specified	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown	Unknown	Unbekannt	Inconnu		Sconosciuto	Unknown
\.


--
-- TOC entry 4679 (class 0 OID 17628)
-- Dependencies: 258
-- Data for Name: file; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.file (file_id, file_name, file_size, file_date, ocr_status) FROM stdin;
\.


--
-- TOC entry 4681 (class 0 OID 17635)
-- Dependencies: 260
-- Data for Name: geom_quality_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.geom_quality_item (geom_quality_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
placeholder	No-GeolCode-specified	Placeholder	Platzhaltergeometrie	Indicative générique		Geometria segnaposto	Placeholder geometry	Placeholder geometry in general, without a concretely defined size	Platzhaltergeometrie allgemein, ohne eine konkret definiert Grösse	Géométrie indicative générique, sans taille concrètement définie		Geometria segnaposto in generale, senza una dimensione concretamente definita	Placeholder geometry in general, without a concretely defined size
placeholder100x100	No-GeolCode-specified	Placeholder100x100	Platzhaltergeometrie 100x100km	Indicative 100x100km		Geometria segnaposto 100x100km	Placeholder geometry 100x100km	Placeholder geometry larger than 100x100km	Platzhaltergeometrie grösser als 100x100km	Géométrie indicative de taille supérieure à 100x100km		Geometria segnaposto superiore a 100x100km	Placeholder geometry larger than 100x100km
placeholder10x10	No-GeolCode-specified	Placeholder10x10	Platzhaltergeometrie 10x10km	Indicative 10x10km		Geometria segnaposto 10x10km	Placeholder geometry 10x10km	Placeholder geometry larger than 10x10km	Platzhaltergeometrie grösser als 10x10km	Géométrie indicative de taille supérieure à 10x10km		Geometria segnaposto superiore a 10x10km	Placeholder geometry larger than 10x10km
placeholder1x1	No-GeolCode-specified	Placeholder1x1	Platzhaltergeometrie 1x1km	Indicative 1x1km		Geometria segnaposto 1x1km	Placeholder geometry 1x1km	Placeholder geometry larger than 1x1km	Platzhaltergeometrie grösser als 1x1km	Géométrie indicative de taille supérieure à 1x1km		Geometria segnaposto di dimensioni superiori a 1x1km	Placeholder geometry larger than 1x1km
simplification	No-GeolCode-specified	Simplification	Vereinfachung	Simplifiée		Semplificazione	Simplified	Simplified from actual geometry	Der tatsächlichen Geometrie angenähert	Approximation de la géométrie réelle		Approssimazione alla geometria reale	Simplified from actual geometry
original	No-GeolCode-specified	Original	Original	Originale		Originale	Original	Corresponds to the original, unaltered geometry	Entspricht der tatsächlichen Geometrie	Correspond à la géométrie réelle		Corrisponde alla geometria effettiva	Corresponds to the original, unaltered geometry
revised	No-GeolCode-specified	Revised	Überarbeitet	Indicative révisée		Versione revisionata	Revised	Revised from placeholder geometry	Von Platzhaltergeometrie korrigiert	Géométrie indicative corrigée		Corretto dalla geometria segnaposto	Revised from placeholder geometry
unkown	No-GeolCode-specified	Unkown	Unbekannt	Inconnue		Sconosciuto	Unknown	Quality of geometry not known	Qualität der Geometrie nicht bekannt	Qualité de la géométrie inconnue		Qualità della geometria non nota	Quality of geometry not known
imported	No-GeolCode-specified	Imported	Importiert	Importée		Importato	Imported	Imported geometry	Importierte Geometrie	Géométrie importée		Geometria importata	Imported geometry
\.


--
-- TOC entry 4682 (class 0 OID 17640)
-- Dependencies: 261
-- Data for Name: id; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.id (id_id, asset_id, id, description) FROM stdin;
\.


--
-- TOC entry 4684 (class 0 OID 17646)
-- Dependencies: 263
-- Data for Name: internal_project; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.internal_project (internal_project_id, name, description, date_delivered) FROM stdin;
\.


--
-- TOC entry 4686 (class 0 OID 17652)
-- Dependencies: 265
-- Data for Name: internal_use; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.internal_use (internal_use_id, is_available, status_asset_use_item_code, start_availability_date) FROM stdin;
7	f	tobechecked	\N
34	t	tobechecked	\N
37	f	tobechecked	\N
40	f	tobechecked	\N
43	f	tobechecked	\N
75	t	tobechecked	\N
78	t	tobechecked	\N
159	t	tobechecked	\N
162	t	tobechecked	\N
165	t	tobechecked	\N
168	t	tobechecked	\N
171	t	tobechecked	\N
173	t	tobechecked	\N
176	t	tobechecked	\N
179	t	tobechecked	\N
182	t	tobechecked	\N
185	t	tobechecked	\N
188	t	tobechecked	\N
191	t	tobechecked	\N
194	t	tobechecked	\N
197	t	tobechecked	\N
200	t	tobechecked	\N
203	t	tobechecked	\N
206	t	tobechecked	\N
209	t	tobechecked	\N
212	t	tobechecked	\N
215	t	tobechecked	\N
218	t	tobechecked	\N
221	t	tobechecked	\N
224	t	tobechecked	\N
227	t	tobechecked	\N
230	t	tobechecked	\N
233	t	tobechecked	\N
236	t	tobechecked	\N
239	t	tobechecked	\N
242	t	tobechecked	\N
245	t	tobechecked	\N
248	t	tobechecked	\N
251	t	tobechecked	\N
254	t	tobechecked	\N
257	t	tobechecked	\N
260	t	tobechecked	\N
263	t	tobechecked	\N
266	t	tobechecked	\N
269	t	tobechecked	\N
272	t	tobechecked	\N
275	t	tobechecked	\N
278	t	tobechecked	\N
281	t	tobechecked	\N
284	t	tobechecked	\N
287	t	tobechecked	\N
290	t	tobechecked	\N
293	t	tobechecked	\N
296	t	tobechecked	\N
299	t	tobechecked	\N
302	t	tobechecked	\N
305	t	tobechecked	\N
308	t	tobechecked	\N
311	t	tobechecked	\N
314	t	tobechecked	\N
317	t	tobechecked	\N
320	t	tobechecked	\N
323	t	tobechecked	\N
326	t	tobechecked	\N
329	t	tobechecked	\N
332	t	tobechecked	\N
335	t	tobechecked	\N
338	t	tobechecked	\N
341	t	tobechecked	\N
347	f	tobechecked	\N
350	f	tobechecked	\N
353	f	tobechecked	\N
356	f	tobechecked	\N
359	f	tobechecked	\N
362	f	tobechecked	\N
365	f	tobechecked	\N
368	f	tobechecked	\N
371	f	tobechecked	\N
374	f	tobechecked	\N
377	f	tobechecked	\N
380	f	tobechecked	\N
383	f	tobechecked	\N
386	f	tobechecked	\N
389	f	tobechecked	\N
392	f	tobechecked	\N
395	f	tobechecked	\N
398	f	tobechecked	\N
401	f	tobechecked	\N
404	f	tobechecked	\N
407	f	tobechecked	\N
410	f	tobechecked	\N
413	f	tobechecked	\N
416	f	tobechecked	\N
419	f	tobechecked	\N
422	f	tobechecked	\N
425	f	tobechecked	\N
428	f	tobechecked	\N
431	f	tobechecked	\N
434	f	tobechecked	\N
437	f	tobechecked	\N
440	f	tobechecked	\N
443	f	tobechecked	\N
446	f	tobechecked	\N
449	f	tobechecked	\N
452	f	tobechecked	\N
455	f	tobechecked	\N
458	f	tobechecked	\N
461	f	tobechecked	\N
464	f	tobechecked	\N
467	f	tobechecked	\N
470	f	tobechecked	\N
473	f	tobechecked	\N
476	f	tobechecked	\N
479	f	tobechecked	\N
482	f	tobechecked	\N
485	f	tobechecked	\N
488	f	tobechecked	\N
491	f	tobechecked	\N
494	f	tobechecked	\N
497	f	tobechecked	\N
500	f	tobechecked	\N
503	f	tobechecked	\N
506	f	tobechecked	\N
509	f	tobechecked	\N
512	f	tobechecked	\N
515	f	tobechecked	\N
518	f	tobechecked	\N
521	f	tobechecked	\N
524	f	tobechecked	\N
527	f	tobechecked	\N
530	f	tobechecked	\N
533	f	tobechecked	\N
536	f	tobechecked	\N
539	f	tobechecked	\N
542	f	tobechecked	\N
545	f	tobechecked	\N
548	f	tobechecked	\N
551	f	tobechecked	\N
554	f	tobechecked	\N
557	f	tobechecked	\N
560	f	tobechecked	\N
563	f	tobechecked	\N
566	f	tobechecked	\N
569	f	tobechecked	\N
572	f	tobechecked	\N
575	f	tobechecked	\N
578	f	tobechecked	\N
581	f	tobechecked	\N
584	f	tobechecked	\N
587	f	tobechecked	\N
590	f	tobechecked	\N
593	f	tobechecked	\N
596	f	tobechecked	\N
599	f	tobechecked	\N
602	f	tobechecked	\N
605	f	tobechecked	\N
608	f	tobechecked	\N
611	f	tobechecked	\N
614	f	tobechecked	\N
617	f	tobechecked	\N
620	f	tobechecked	\N
623	f	tobechecked	\N
626	f	tobechecked	\N
629	f	tobechecked	\N
632	f	tobechecked	\N
635	f	tobechecked	\N
638	f	tobechecked	\N
641	f	tobechecked	\N
644	f	tobechecked	\N
647	f	tobechecked	\N
650	f	tobechecked	\N
653	f	tobechecked	\N
656	f	tobechecked	\N
659	f	tobechecked	\N
662	f	tobechecked	\N
665	f	tobechecked	\N
668	f	tobechecked	\N
671	f	tobechecked	\N
674	f	tobechecked	\N
677	f	tobechecked	\N
680	f	tobechecked	\N
683	f	tobechecked	\N
686	f	tobechecked	\N
689	f	tobechecked	\N
692	f	tobechecked	\N
695	f	tobechecked	\N
698	f	tobechecked	\N
701	f	tobechecked	\N
704	f	tobechecked	\N
707	f	tobechecked	\N
710	f	tobechecked	\N
713	f	tobechecked	\N
716	f	tobechecked	\N
719	f	tobechecked	\N
722	f	tobechecked	\N
725	f	tobechecked	\N
728	f	tobechecked	\N
731	f	tobechecked	\N
734	f	tobechecked	\N
737	f	tobechecked	\N
740	f	tobechecked	\N
743	f	tobechecked	\N
746	f	tobechecked	\N
749	f	tobechecked	\N
752	f	tobechecked	\N
755	f	tobechecked	\N
758	f	tobechecked	\N
761	f	tobechecked	\N
764	f	tobechecked	\N
767	f	tobechecked	\N
770	f	tobechecked	\N
773	f	tobechecked	\N
776	f	tobechecked	\N
779	f	tobechecked	\N
782	f	tobechecked	\N
785	f	tobechecked	\N
788	f	tobechecked	\N
791	f	tobechecked	\N
794	f	tobechecked	\N
797	f	tobechecked	\N
800	f	tobechecked	\N
803	f	tobechecked	\N
806	f	tobechecked	\N
809	f	tobechecked	\N
812	f	tobechecked	\N
815	f	tobechecked	\N
818	f	tobechecked	\N
821	f	tobechecked	\N
824	f	tobechecked	\N
827	f	tobechecked	\N
830	f	tobechecked	\N
833	f	tobechecked	\N
836	f	tobechecked	\N
839	f	tobechecked	\N
842	f	tobechecked	\N
845	f	tobechecked	\N
848	f	tobechecked	\N
851	f	tobechecked	\N
854	f	tobechecked	\N
857	f	tobechecked	\N
860	f	tobechecked	\N
863	f	tobechecked	\N
866	f	tobechecked	\N
869	f	tobechecked	\N
872	f	tobechecked	\N
875	f	tobechecked	\N
878	f	tobechecked	\N
881	f	tobechecked	\N
884	f	tobechecked	\N
887	f	tobechecked	\N
890	f	tobechecked	\N
893	f	tobechecked	\N
896	f	tobechecked	\N
899	f	tobechecked	\N
902	f	tobechecked	\N
905	f	tobechecked	\N
908	f	tobechecked	\N
911	f	tobechecked	\N
914	f	tobechecked	\N
917	f	tobechecked	\N
920	f	tobechecked	\N
923	f	tobechecked	\N
926	f	tobechecked	\N
929	f	tobechecked	\N
932	f	tobechecked	\N
935	f	tobechecked	\N
938	f	tobechecked	\N
941	f	tobechecked	\N
944	f	tobechecked	\N
947	f	tobechecked	\N
950	f	tobechecked	\N
962	t	tobechecked	\N
974	t	tobechecked	\N
1127	t	tobechecked	\N
1163	t	tobechecked	\N
1241	f	tobechecked	\N
1244	t	tobechecked	\N
1253	f	tobechecked	\N
1256	f	tobechecked	\N
1259	f	tobechecked	\N
1262	f	tobechecked	\N
1265	f	tobechecked	\N
1268	f	tobechecked	\N
1271	f	tobechecked	\N
1323	t	tobechecked	\N
1340	f	tobechecked	\N
1349	t	tobechecked	\N
1351	t	tobechecked	\N
1381	f	tobechecked	\N
1465	f	tobechecked	\N
1468	f	tobechecked	\N
1471	f	tobechecked	\N
1474	f	tobechecked	\N
1477	f	tobechecked	\N
1480	f	tobechecked	\N
1483	f	tobechecked	\N
1570	t	tobechecked	\N
1576	t	tobechecked	\N
1657	f	tobechecked	\N
1660	f	tobechecked	\N
1663	f	tobechecked	\N
1672	t	tobechecked	\N
1674	t	tobechecked	\N
1676	t	tobechecked	\N
1723	f	tobechecked	\N
1726	f	tobechecked	\N
1853	t	tobechecked	\N
1856	t	tobechecked	\N
1859	t	tobechecked	\N
1862	t	tobechecked	\N
1865	t	tobechecked	\N
1875	t	tobechecked	\N
1884	t	tobechecked	\N
1962	f	tobechecked	\N
2013	f	tobechecked	\N
2025	t	tobechecked	\N
2073	t	tobechecked	\N
2142	t	tobechecked	\N
2201	f	tobechecked	\N
2231	t	tobechecked	\N
2243	t	tobechecked	\N
2288	t	tobechecked	\N
2312	t	tobechecked	\N
2315	t	tobechecked	\N
2354	t	tobechecked	\N
2357	t	tobechecked	\N
2402	t	tobechecked	\N
2453	t	tobechecked	\N
2456	t	tobechecked	\N
2459	t	tobechecked	\N
2462	t	tobechecked	\N
2465	t	tobechecked	\N
2468	t	tobechecked	\N
2584	t	tobechecked	\N
2637	f	tobechecked	\N
2700	t	tobechecked	\N
2720	t	tobechecked	\N
2723	t	tobechecked	\N
2726	t	tobechecked	\N
2729	t	tobechecked	\N
2732	t	tobechecked	\N
2735	t	tobechecked	\N
2738	t	tobechecked	\N
2756	t	tobechecked	\N
2759	t	tobechecked	\N
2801	t	tobechecked	\N
2807	t	tobechecked	\N
2843	f	tobechecked	\N
2888	t	tobechecked	\N
2894	f	tobechecked	\N
2939	t	tobechecked	\N
2945	t	tobechecked	\N
2954	f	tobechecked	\N
2993	f	tobechecked	\N
2996	f	tobechecked	\N
2999	f	tobechecked	\N
3038	t	tobechecked	\N
3041	t	tobechecked	\N
3044	t	tobechecked	\N
3047	t	tobechecked	\N
3050	t	tobechecked	\N
3053	t	tobechecked	\N
3063	f	tobechecked	\N
3066	f	tobechecked	\N
3069	f	tobechecked	\N
3074	t	tobechecked	\N
3134	f	tobechecked	\N
3137	f	tobechecked	\N
3140	f	tobechecked	\N
3143	f	tobechecked	\N
3152	f	tobechecked	\N
3158	f	tobechecked	\N
3161	f	tobechecked	\N
3164	f	tobechecked	\N
3167	f	tobechecked	\N
3170	f	tobechecked	\N
3173	f	tobechecked	\N
3176	f	tobechecked	\N
3179	f	tobechecked	\N
3182	f	tobechecked	\N
3185	f	tobechecked	\N
3188	f	tobechecked	\N
3194	t	tobechecked	\N
3197	t	tobechecked	\N
3224	t	tobechecked	\N
3227	t	tobechecked	\N
3230	t	tobechecked	\N
3233	t	tobechecked	\N
3236	t	tobechecked	\N
3263	f	tobechecked	\N
3269	f	tobechecked	\N
3272	f	tobechecked	\N
3293	f	tobechecked	\N
3296	f	tobechecked	\N
3302	t	tobechecked	\N
3304	t	tobechecked	\N
3306	t	tobechecked	\N
3308	t	tobechecked	\N
3311	t	tobechecked	\N
3368	t	tobechecked	\N
3380	t	tobechecked	\N
3404	t	tobechecked	\N
3464	t	tobechecked	\N
3572	t	tobechecked	\N
3590	t	tobechecked	\N
3635	t	tobechecked	\N
3650	t	tobechecked	\N
3659	t	tobechecked	\N
3671	t	tobechecked	\N
3908	t	tobechecked	\N
3917	t	tobechecked	\N
3935	f	tobechecked	\N
3938	f	tobechecked	\N
3944	t	tobechecked	\N
3947	t	tobechecked	\N
3956	t	tobechecked	\N
3965	t	tobechecked	\N
3974	t	tobechecked	\N
3989	t	tobechecked	\N
4013	t	tobechecked	\N
4031	f	tobechecked	\N
4052	t	tobechecked	\N
4067	t	tobechecked	\N
4091	t	tobechecked	\N
4121	t	tobechecked	\N
4124	t	tobechecked	\N
4126	t	tobechecked	\N
4129	t	tobechecked	\N
4132	t	tobechecked	\N
4135	t	tobechecked	\N
4138	t	tobechecked	\N
4141	t	tobechecked	\N
4144	t	tobechecked	\N
4147	t	tobechecked	\N
4150	t	tobechecked	\N
4153	t	tobechecked	\N
4156	t	tobechecked	\N
4159	t	tobechecked	\N
4162	t	tobechecked	\N
4165	t	tobechecked	\N
4168	t	tobechecked	\N
4171	t	tobechecked	\N
4174	t	tobechecked	\N
4177	t	tobechecked	\N
4180	t	tobechecked	\N
4183	t	tobechecked	\N
4186	t	tobechecked	\N
4189	t	tobechecked	\N
4192	t	tobechecked	\N
4195	t	tobechecked	\N
4198	t	tobechecked	\N
4201	t	tobechecked	\N
4204	t	tobechecked	\N
4207	t	tobechecked	\N
4210	t	tobechecked	\N
4213	t	tobechecked	\N
4216	t	tobechecked	\N
4219	t	tobechecked	\N
4222	t	tobechecked	\N
4225	t	tobechecked	\N
4228	t	tobechecked	\N
4231	t	tobechecked	\N
4234	t	tobechecked	\N
4237	t	tobechecked	\N
4240	t	tobechecked	\N
4243	t	tobechecked	\N
4246	t	tobechecked	\N
4249	t	tobechecked	\N
4252	t	tobechecked	\N
4255	t	tobechecked	\N
4258	t	tobechecked	\N
4261	t	tobechecked	\N
4264	t	tobechecked	\N
4267	t	tobechecked	\N
4270	t	tobechecked	\N
4273	t	tobechecked	\N
4276	t	tobechecked	\N
4279	t	tobechecked	\N
4282	t	tobechecked	\N
4285	t	tobechecked	\N
4288	t	tobechecked	\N
4291	t	tobechecked	\N
4294	t	tobechecked	\N
4297	t	tobechecked	\N
4300	t	tobechecked	\N
4303	t	tobechecked	\N
4306	t	tobechecked	\N
4312	t	tobechecked	\N
4315	t	tobechecked	\N
4318	t	tobechecked	\N
4321	t	tobechecked	\N
4324	t	tobechecked	\N
4327	t	tobechecked	\N
4330	t	tobechecked	\N
4333	t	tobechecked	\N
4336	t	tobechecked	\N
4339	t	tobechecked	\N
4342	t	tobechecked	\N
4345	t	tobechecked	\N
4348	t	tobechecked	\N
4351	t	tobechecked	\N
4354	t	tobechecked	\N
4357	t	tobechecked	\N
4360	t	tobechecked	\N
4363	t	tobechecked	\N
4366	t	tobechecked	\N
4369	t	tobechecked	\N
4372	t	tobechecked	\N
4378	t	tobechecked	\N
4384	t	tobechecked	\N
4390	t	tobechecked	\N
4396	t	tobechecked	\N
4399	t	tobechecked	\N
4402	t	tobechecked	\N
4405	t	tobechecked	\N
4420	t	tobechecked	\N
4429	t	tobechecked	\N
4450	t	tobechecked	\N
4458	t	tobechecked	\N
4461	t	tobechecked	\N
4464	t	tobechecked	\N
4467	t	tobechecked	\N
4470	t	tobechecked	\N
4473	t	tobechecked	\N
4476	t	tobechecked	\N
4479	t	tobechecked	\N
4482	t	tobechecked	\N
4485	t	tobechecked	\N
4488	t	tobechecked	\N
4491	t	tobechecked	\N
4530	t	tobechecked	\N
4533	t	tobechecked	\N
4535	f	tobechecked	\N
4538	f	tobechecked	\N
4541	t	tobechecked	\N
4544	t	tobechecked	\N
4547	t	tobechecked	\N
4550	t	tobechecked	\N
4553	t	tobechecked	\N
4556	t	tobechecked	\N
4559	t	tobechecked	\N
4562	t	tobechecked	\N
4565	t	tobechecked	\N
4568	t	tobechecked	\N
4571	t	tobechecked	\N
4574	t	tobechecked	\N
4577	t	tobechecked	\N
4580	t	tobechecked	\N
4583	t	tobechecked	\N
4586	t	tobechecked	\N
4589	t	tobechecked	\N
4592	t	tobechecked	\N
4604	f	tobechecked	\N
4616	f	tobechecked	2024-12-31 00:00:00
4619	f	tobechecked	2023-04-30 00:00:00
4622	t	tobechecked	\N
4625	f	tobechecked	\N
4628	f	tobechecked	\N
4634	t	tobechecked	\N
4664	t	tobechecked	\N
4676	t	tobechecked	\N
4795	t	tobechecked	\N
4781	t	tobechecked	\N
4778	t	tobechecked	\N
4771	t	approved	\N
4784	t	tobechecked	\N
4769	t	approved	\N
4773	t	approved	\N
4761	t	tobechecked	\N
4789	t	approved	\N
4787	t	approved	\N
4792	t	tobechecked	\N
4746	t	tobechecked	\N
4798	t	tobechecked	\N
4764	t	tobechecked	\N
4800	t	tobechecked	\N
4826	t	tobechecked	\N
4802	t	tobechecked	\N
4823	t	tobechecked	\N
4829	t	tobechecked	\N
4835	t	tobechecked	\N
4838	t	tobechecked	\N
4841	t	tobechecked	\N
4847	t	tobechecked	\N
4844	t	tobechecked	\N
4853	t	tobechecked	\N
4850	t	tobechecked	\N
4856	t	tobechecked	\N
4869	t	tobechecked	\N
4859	t	tobechecked	\N
4866	t	tobechecked	\N
4812	t	tobechecked	\N
4872	t	tobechecked	\N
4878	t	tobechecked	\N
4804	t	tobechecked	\N
4815	t	tobechecked	\N
4915	t	tobechecked	\N
4818	t	tobechecked	\N
4881	t	tobechecked	\N
4899	t	tobechecked	\N
4912	t	tobechecked	\N
4921	t	tobechecked	\N
4918	t	tobechecked	\N
4924	t	tobechecked	\N
4939	t	tobechecked	\N
4930	t	tobechecked	\N
4933	t	tobechecked	\N
4936	t	tobechecked	\N
4945	t	tobechecked	\N
4942	t	tobechecked	\N
4954	t	tobechecked	\N
4948	t	tobechecked	\N
4951	t	tobechecked	\N
4963	t	tobechecked	\N
4957	t	tobechecked	\N
4960	t	tobechecked	\N
4968	t	tobechecked	\N
4971	t	tobechecked	\N
4736	t	tobechecked	\N
4749	t	tobechecked	\N
4976	t	tobechecked	\N
4979	t	tobechecked	\N
4988	t	tobechecked	\N
4991	t	tobechecked	\N
4994	t	tobechecked	\N
4997	t	tobechecked	\N
5000	t	tobechecked	\N
5003	t	tobechecked	\N
5006	t	tobechecked	\N
5009	t	tobechecked	\N
5012	t	tobechecked	\N
5015	t	tobechecked	\N
5018	t	tobechecked	\N
5021	t	tobechecked	\N
5024	t	tobechecked	\N
5027	t	tobechecked	\N
5030	t	tobechecked	\N
5033	t	tobechecked	\N
5036	t	tobechecked	\N
5039	t	tobechecked	\N
5042	t	tobechecked	\N
5045	t	tobechecked	\N
5048	t	tobechecked	\N
5051	t	tobechecked	\N
5053	t	tobechecked	\N
5056	t	tobechecked	\N
5059	t	tobechecked	\N
5062	t	tobechecked	\N
5065	t	tobechecked	\N
5068	t	tobechecked	\N
5071	t	tobechecked	\N
5074	t	tobechecked	\N
5077	t	tobechecked	\N
5080	t	tobechecked	\N
5083	t	tobechecked	\N
5086	t	tobechecked	\N
5089	t	tobechecked	\N
5092	t	tobechecked	\N
5095	t	tobechecked	\N
5098	t	tobechecked	\N
5101	t	tobechecked	\N
5104	t	tobechecked	\N
5107	t	tobechecked	\N
5110	t	tobechecked	\N
5113	t	tobechecked	\N
5116	t	tobechecked	\N
5119	t	tobechecked	\N
5122	t	tobechecked	\N
5125	t	tobechecked	\N
5128	t	tobechecked	\N
5131	t	tobechecked	\N
5134	t	tobechecked	\N
5137	t	tobechecked	\N
5140	t	tobechecked	\N
5143	t	tobechecked	\N
5146	t	tobechecked	\N
5149	t	tobechecked	\N
5152	t	tobechecked	\N
5155	t	tobechecked	\N
5158	f	tobechecked	\N
5161	f	tobechecked	\N
5170	t	tobechecked	\N
5173	t	tobechecked	\N
5218	t	tobechecked	\N
5230	t	tobechecked	\N
5233	t	tobechecked	\N
5236	t	tobechecked	\N
5239	t	tobechecked	\N
5242	t	tobechecked	\N
5245	t	tobechecked	\N
5248	t	tobechecked	\N
5251	t	tobechecked	\N
5254	t	tobechecked	\N
5257	t	tobechecked	\N
5260	t	tobechecked	\N
5263	t	tobechecked	\N
5266	t	tobechecked	\N
5269	t	tobechecked	\N
5272	t	tobechecked	\N
5275	t	tobechecked	\N
5278	t	tobechecked	\N
5281	t	tobechecked	\N
5284	t	tobechecked	\N
5287	t	tobechecked	\N
5290	t	tobechecked	\N
5293	t	tobechecked	\N
5296	t	tobechecked	\N
5299	t	tobechecked	\N
5302	t	tobechecked	\N
5305	t	tobechecked	\N
5308	t	tobechecked	\N
5311	t	tobechecked	\N
5314	t	tobechecked	\N
5317	t	tobechecked	\N
5320	t	tobechecked	\N
5323	t	tobechecked	\N
5326	t	tobechecked	\N
5329	t	tobechecked	\N
5332	t	tobechecked	\N
5335	t	tobechecked	\N
5337	t	tobechecked	\N
5339	t	tobechecked	\N
5349	t	tobechecked	\N
5351	t	tobechecked	\N
5380	t	tobechecked	\N
5443	f	tobechecked	\N
5464	t	tobechecked	\N
5470	t	tobechecked	\N
5491	t	tobechecked	\N
5561	f	tobechecked	\N
5564	t	tobechecked	\N
5566	t	tobechecked	\N
5638	t	tobechecked	\N
5644	t	tobechecked	\N
5646	t	tobechecked	\N
5648	t	tobechecked	\N
5650	t	tobechecked	\N
5652	t	tobechecked	\N
5678	t	tobechecked	\N
5699	t	tobechecked	\N
5705	t	tobechecked	\N
5708	t	tobechecked	\N
5711	t	tobechecked	\N
5714	t	tobechecked	\N
5717	t	tobechecked	\N
5726	t	tobechecked	\N
5729	t	tobechecked	\N
5777	t	tobechecked	\N
5780	t	tobechecked	\N
5783	t	tobechecked	\N
5786	t	tobechecked	\N
5789	t	tobechecked	\N
5792	t	tobechecked	\N
5795	t	tobechecked	\N
5803	f	tobechecked	\N
5865	f	tobechecked	\N
5868	t	tobechecked	\N
5874	f	tobechecked	\N
5876	t	tobechecked	\N
5882	t	tobechecked	\N
5885	t	tobechecked	\N
5906	t	tobechecked	\N
5909	t	tobechecked	\N
5942	t	tobechecked	\N
5945	t	tobechecked	\N
5954	t	tobechecked	\N
5957	t	tobechecked	\N
5960	t	tobechecked	\N
5963	f	tobechecked	\N
5966	t	tobechecked	\N
5969	t	tobechecked	\N
5972	t	tobechecked	\N
5975	t	tobechecked	\N
5978	t	tobechecked	\N
5981	t	tobechecked	\N
5984	t	tobechecked	\N
5990	t	tobechecked	\N
6006	f	tobechecked	\N
6058	t	tobechecked	\N
6076	f	tobechecked	\N
6097	f	tobechecked	\N
6108	t	tobechecked	\N
6111	t	tobechecked	\N
6150	t	tobechecked	\N
6153	t	tobechecked	\N
6156	f	tobechecked	\N
6162	t	tobechecked	\N
6165	t	tobechecked	\N
6168	t	tobechecked	\N
6171	t	tobechecked	\N
6174	t	tobechecked	\N
6177	f	tobechecked	\N
6180	t	tobechecked	\N
6183	t	tobechecked	\N
6186	t	tobechecked	\N
6189	t	tobechecked	\N
6192	t	tobechecked	\N
6195	t	tobechecked	\N
6198	t	tobechecked	\N
6201	t	tobechecked	\N
6204	t	tobechecked	\N
6207	t	tobechecked	\N
6210	t	tobechecked	\N
6213	t	tobechecked	\N
6216	t	tobechecked	\N
6219	t	tobechecked	\N
6222	t	tobechecked	\N
6225	t	tobechecked	\N
6228	t	tobechecked	\N
6231	t	tobechecked	\N
6234	t	tobechecked	\N
6237	t	tobechecked	\N
6240	t	tobechecked	\N
6243	t	tobechecked	\N
6246	t	tobechecked	\N
6249	t	tobechecked	\N
6252	t	tobechecked	\N
6255	f	tobechecked	\N
6258	t	tobechecked	\N
6261	t	tobechecked	\N
6264	t	tobechecked	\N
6267	t	tobechecked	\N
6270	t	tobechecked	\N
6273	f	tobechecked	\N
6276	t	tobechecked	\N
6279	t	tobechecked	\N
6282	t	tobechecked	\N
6285	t	tobechecked	\N
6300	t	tobechecked	\N
6303	t	tobechecked	\N
6306	t	tobechecked	\N
6309	t	tobechecked	\N
6321	t	tobechecked	\N
6324	t	tobechecked	\N
6327	t	tobechecked	\N
6330	t	tobechecked	\N
6333	t	tobechecked	\N
6336	t	tobechecked	\N
6339	t	tobechecked	\N
6342	t	tobechecked	\N
6345	t	tobechecked	\N
6348	t	tobechecked	\N
6351	t	tobechecked	\N
6363	t	tobechecked	\N
6372	t	tobechecked	\N
6375	t	tobechecked	\N
6378	t	tobechecked	\N
6381	t	tobechecked	\N
6384	t	tobechecked	\N
6387	t	tobechecked	\N
6390	t	tobechecked	\N
6393	t	tobechecked	\N
6396	t	tobechecked	\N
6399	t	tobechecked	\N
6402	t	tobechecked	\N
6414	t	tobechecked	\N
6417	t	tobechecked	\N
6420	t	tobechecked	\N
6423	t	tobechecked	\N
6426	t	tobechecked	\N
6429	t	tobechecked	\N
6432	t	tobechecked	\N
6435	t	tobechecked	\N
6438	t	tobechecked	\N
6441	t	tobechecked	\N
6450	t	tobechecked	\N
6453	t	tobechecked	\N
6456	t	tobechecked	\N
6462	t	tobechecked	\N
6465	f	tobechecked	\N
6468	f	tobechecked	\N
6471	t	tobechecked	\N
6474	t	tobechecked	\N
6477	f	tobechecked	\N
6480	f	tobechecked	\N
6483	f	tobechecked	\N
6486	t	tobechecked	\N
6489	t	tobechecked	\N
6492	f	tobechecked	\N
6495	f	tobechecked	\N
6498	t	tobechecked	\N
6501	f	tobechecked	\N
6504	t	tobechecked	\N
6507	t	tobechecked	\N
6510	f	tobechecked	\N
6513	f	tobechecked	\N
6516	f	tobechecked	\N
6519	t	tobechecked	\N
6522	t	tobechecked	\N
6525	t	tobechecked	\N
6531	t	tobechecked	\N
6534	t	tobechecked	\N
6537	t	tobechecked	\N
6540	t	tobechecked	\N
6543	t	tobechecked	\N
6546	t	tobechecked	\N
6549	t	tobechecked	\N
6552	f	tobechecked	\N
6555	f	tobechecked	\N
6558	t	tobechecked	\N
6561	t	tobechecked	\N
6564	f	tobechecked	\N
6567	t	tobechecked	\N
6570	t	tobechecked	\N
6573	f	tobechecked	\N
6576	t	tobechecked	\N
6579	t	tobechecked	\N
6582	t	tobechecked	\N
6585	t	tobechecked	\N
6588	t	tobechecked	\N
6591	t	tobechecked	\N
6594	t	tobechecked	\N
6597	t	tobechecked	\N
6600	t	tobechecked	\N
6603	t	tobechecked	\N
6606	t	tobechecked	\N
6609	t	tobechecked	\N
6612	t	tobechecked	\N
6615	t	tobechecked	\N
6618	t	tobechecked	\N
6621	t	tobechecked	\N
6624	t	tobechecked	\N
6627	t	tobechecked	\N
6654	t	tobechecked	\N
6657	t	tobechecked	\N
6660	t	tobechecked	\N
6681	t	tobechecked	\N
6684	t	tobechecked	\N
6687	t	tobechecked	\N
6702	t	tobechecked	\N
6705	t	tobechecked	\N
6708	t	tobechecked	\N
6711	t	tobechecked	\N
6714	t	tobechecked	\N
6717	t	tobechecked	\N
6720	t	tobechecked	\N
6723	t	tobechecked	\N
6726	t	tobechecked	\N
6729	t	tobechecked	\N
6732	t	tobechecked	\N
6735	t	tobechecked	\N
6738	t	tobechecked	\N
6741	t	tobechecked	\N
6744	t	tobechecked	\N
6747	t	tobechecked	\N
6750	t	tobechecked	\N
6753	t	tobechecked	\N
6756	t	tobechecked	\N
6759	t	tobechecked	\N
6762	t	tobechecked	\N
6765	t	tobechecked	\N
6768	t	tobechecked	\N
6771	t	tobechecked	\N
6774	t	tobechecked	\N
6777	t	tobechecked	\N
6780	t	tobechecked	\N
6783	t	tobechecked	\N
6786	t	tobechecked	\N
6789	t	tobechecked	\N
6792	t	tobechecked	\N
6795	t	tobechecked	\N
6798	t	tobechecked	\N
6801	t	tobechecked	\N
6804	t	tobechecked	\N
6807	t	tobechecked	\N
6810	t	tobechecked	\N
6813	t	tobechecked	\N
6816	t	tobechecked	\N
6819	t	tobechecked	\N
6822	t	tobechecked	\N
6825	t	tobechecked	\N
6828	t	tobechecked	\N
6831	t	tobechecked	\N
6834	t	tobechecked	\N
6837	t	tobechecked	\N
6840	t	tobechecked	\N
6843	t	tobechecked	\N
6846	t	tobechecked	\N
6849	t	tobechecked	\N
6852	t	tobechecked	\N
6855	t	tobechecked	\N
6858	t	tobechecked	\N
6861	t	tobechecked	\N
6864	t	tobechecked	\N
6867	t	tobechecked	\N
6870	t	tobechecked	\N
6873	t	tobechecked	\N
6876	t	tobechecked	\N
6885	t	tobechecked	\N
6888	f	tobechecked	\N
6891	f	tobechecked	\N
6894	f	tobechecked	\N
6897	f	tobechecked	\N
6900	t	tobechecked	\N
6903	f	tobechecked	\N
6906	f	tobechecked	\N
6909	f	tobechecked	\N
6912	f	tobechecked	\N
6915	t	tobechecked	\N
6918	f	tobechecked	\N
6924	t	tobechecked	\N
6927	t	tobechecked	\N
6930	t	tobechecked	\N
6933	t	tobechecked	\N
6936	t	tobechecked	\N
6939	t	tobechecked	\N
6942	t	tobechecked	\N
6945	t	tobechecked	\N
6954	t	tobechecked	\N
6957	t	tobechecked	\N
6960	t	tobechecked	\N
6963	t	tobechecked	\N
6966	t	tobechecked	\N
6969	t	tobechecked	\N
6972	t	tobechecked	\N
6975	t	tobechecked	\N
6978	t	tobechecked	\N
6981	t	tobechecked	\N
6984	t	tobechecked	\N
6987	t	tobechecked	\N
6990	t	tobechecked	\N
6993	t	tobechecked	\N
6996	t	tobechecked	\N
6999	t	tobechecked	\N
7008	t	tobechecked	\N
7011	t	tobechecked	\N
7014	t	tobechecked	\N
7017	t	tobechecked	\N
7020	t	tobechecked	\N
7023	t	tobechecked	\N
7026	t	tobechecked	\N
7029	t	tobechecked	\N
7056	t	tobechecked	\N
7062	t	tobechecked	\N
7065	t	tobechecked	\N
7068	t	tobechecked	\N
7071	t	tobechecked	\N
7083	t	tobechecked	\N
7086	t	tobechecked	\N
7089	t	tobechecked	\N
7092	t	tobechecked	\N
7095	t	tobechecked	\N
7098	t	tobechecked	\N
7101	t	tobechecked	\N
7104	t	tobechecked	\N
7107	t	tobechecked	\N
7110	t	tobechecked	\N
7113	t	tobechecked	\N
7116	f	tobechecked	\N
7119	f	tobechecked	\N
7122	f	tobechecked	\N
7125	f	tobechecked	\N
7128	f	tobechecked	\N
7131	f	tobechecked	\N
7134	f	tobechecked	\N
7137	f	tobechecked	\N
7140	f	tobechecked	\N
7143	f	tobechecked	\N
7146	f	tobechecked	\N
7149	f	tobechecked	\N
7152	f	tobechecked	\N
7155	f	tobechecked	\N
7158	f	tobechecked	\N
7161	f	tobechecked	\N
7164	f	tobechecked	\N
7167	f	tobechecked	\N
7170	f	tobechecked	\N
7173	f	tobechecked	\N
7176	f	tobechecked	\N
7179	f	tobechecked	\N
7182	f	tobechecked	\N
7185	f	tobechecked	\N
7188	f	tobechecked	\N
7191	f	tobechecked	\N
7194	f	tobechecked	\N
7197	f	tobechecked	\N
7200	f	tobechecked	\N
7203	f	tobechecked	\N
7206	f	tobechecked	\N
7209	f	tobechecked	\N
7212	f	tobechecked	\N
7215	f	tobechecked	\N
7218	f	tobechecked	\N
7221	f	tobechecked	\N
7224	f	tobechecked	\N
7227	f	tobechecked	\N
7230	f	tobechecked	\N
7233	f	tobechecked	\N
7236	f	tobechecked	\N
7239	f	tobechecked	\N
7242	f	tobechecked	\N
7245	f	tobechecked	\N
7248	f	tobechecked	\N
7251	f	tobechecked	\N
7254	f	tobechecked	\N
7257	f	tobechecked	\N
7260	f	tobechecked	\N
7263	f	tobechecked	\N
7266	f	tobechecked	\N
7269	f	tobechecked	\N
7272	f	tobechecked	\N
7275	f	tobechecked	\N
7278	f	tobechecked	\N
7281	f	tobechecked	\N
7284	f	tobechecked	\N
7287	f	tobechecked	\N
7290	f	tobechecked	\N
7293	f	tobechecked	\N
7296	f	tobechecked	\N
7299	f	tobechecked	\N
7302	f	tobechecked	\N
7305	f	tobechecked	\N
7308	f	tobechecked	\N
7311	f	tobechecked	\N
7314	f	tobechecked	\N
7317	f	tobechecked	\N
7320	f	tobechecked	\N
7323	f	tobechecked	\N
7326	f	tobechecked	\N
7329	f	tobechecked	\N
7332	f	tobechecked	\N
7335	f	tobechecked	\N
7338	f	tobechecked	\N
7341	f	tobechecked	\N
7344	f	tobechecked	\N
7347	f	tobechecked	\N
7350	f	tobechecked	\N
7353	f	tobechecked	\N
7356	f	tobechecked	\N
7359	f	tobechecked	\N
7362	f	tobechecked	\N
7365	f	tobechecked	\N
7368	f	tobechecked	\N
7371	f	tobechecked	\N
7374	f	tobechecked	\N
7377	f	tobechecked	\N
7380	f	tobechecked	\N
7383	f	tobechecked	\N
7386	f	tobechecked	\N
7389	f	tobechecked	\N
7392	f	tobechecked	\N
7395	f	tobechecked	\N
7398	f	tobechecked	\N
7401	f	tobechecked	\N
7404	f	tobechecked	\N
7407	f	tobechecked	\N
7410	f	tobechecked	\N
7413	f	tobechecked	\N
7416	f	tobechecked	\N
7419	f	tobechecked	\N
7422	f	tobechecked	\N
7425	f	tobechecked	\N
7428	f	tobechecked	\N
7431	f	tobechecked	\N
7434	f	tobechecked	\N
7437	f	tobechecked	\N
7440	f	tobechecked	\N
7443	f	tobechecked	\N
7446	f	tobechecked	\N
7449	f	tobechecked	\N
7452	f	tobechecked	\N
7455	f	tobechecked	\N
7458	f	tobechecked	\N
7461	f	tobechecked	\N
7464	f	tobechecked	\N
7467	f	tobechecked	\N
7470	f	tobechecked	\N
7473	f	tobechecked	\N
7476	f	tobechecked	\N
7479	f	tobechecked	\N
7482	f	tobechecked	\N
7485	f	tobechecked	\N
7488	f	tobechecked	\N
7491	f	tobechecked	\N
7494	f	tobechecked	\N
7497	f	tobechecked	\N
7500	f	tobechecked	\N
7503	f	tobechecked	\N
7506	f	tobechecked	\N
7509	f	tobechecked	\N
7512	f	tobechecked	\N
7515	f	tobechecked	\N
7518	f	tobechecked	\N
7521	f	tobechecked	\N
7524	f	tobechecked	\N
7527	f	tobechecked	\N
7530	f	tobechecked	\N
7533	f	tobechecked	\N
7536	f	tobechecked	\N
7539	f	tobechecked	\N
7542	f	tobechecked	\N
7545	f	tobechecked	\N
7548	f	tobechecked	\N
7551	f	tobechecked	\N
7554	f	tobechecked	\N
7557	f	tobechecked	\N
7560	f	tobechecked	\N
7563	f	tobechecked	\N
7566	f	tobechecked	\N
7569	f	tobechecked	\N
7572	f	tobechecked	\N
7575	f	tobechecked	\N
7578	f	tobechecked	\N
7581	f	tobechecked	\N
7584	f	tobechecked	\N
7596	t	tobechecked	\N
7620	t	tobechecked	\N
7647	t	tobechecked	\N
7650	t	tobechecked	\N
7653	t	tobechecked	\N
7659	t	tobechecked	\N
7662	t	tobechecked	\N
7688	t	tobechecked	\N
7691	t	tobechecked	\N
7694	t	tobechecked	\N
7697	t	tobechecked	\N
7699	t	tobechecked	\N
7702	t	tobechecked	\N
7705	t	tobechecked	\N
7708	t	tobechecked	\N
7711	t	tobechecked	\N
7714	t	tobechecked	\N
7716	t	tobechecked	\N
7719	t	tobechecked	\N
7722	t	tobechecked	\N
7725	t	tobechecked	\N
7728	t	tobechecked	\N
7731	t	tobechecked	\N
7734	t	tobechecked	\N
7737	t	tobechecked	\N
7740	t	tobechecked	\N
7743	t	tobechecked	\N
7746	t	tobechecked	\N
7749	t	tobechecked	\N
7752	t	tobechecked	\N
7754	t	tobechecked	\N
7756	t	tobechecked	\N
7758	t	tobechecked	\N
7760	t	tobechecked	\N
7762	t	tobechecked	\N
7764	t	tobechecked	\N
7766	t	tobechecked	\N
7768	t	tobechecked	\N
7770	t	tobechecked	\N
7772	t	tobechecked	\N
7775	t	tobechecked	\N
7778	t	tobechecked	\N
7781	t	tobechecked	\N
7784	t	tobechecked	\N
7786	t	tobechecked	\N
7788	t	tobechecked	\N
7790	t	tobechecked	\N
7793	t	tobechecked	\N
7796	t	tobechecked	\N
7799	t	tobechecked	\N
7802	t	tobechecked	\N
7805	t	tobechecked	\N
7808	t	tobechecked	\N
7811	t	tobechecked	\N
7814	t	tobechecked	\N
7817	t	tobechecked	\N
7820	t	tobechecked	\N
7823	t	tobechecked	\N
7826	t	tobechecked	\N
7829	t	tobechecked	\N
7832	t	tobechecked	\N
7835	t	tobechecked	\N
7837	t	tobechecked	\N
7839	t	tobechecked	\N
7842	t	tobechecked	\N
7845	t	tobechecked	\N
7848	t	tobechecked	\N
7851	t	tobechecked	\N
7860	t	tobechecked	\N
7863	t	tobechecked	\N
7866	t	tobechecked	\N
7869	t	tobechecked	\N
7872	t	tobechecked	\N
7875	t	tobechecked	\N
7878	t	tobechecked	\N
7935	t	tobechecked	\N
7938	t	tobechecked	\N
7941	t	tobechecked	\N
7944	t	tobechecked	\N
7947	t	tobechecked	\N
7950	t	tobechecked	\N
7962	f	tobechecked	\N
7965	f	tobechecked	\N
7968	f	tobechecked	\N
7971	f	tobechecked	\N
7974	f	tobechecked	\N
7977	f	tobechecked	\N
7980	f	tobechecked	\N
7983	t	tobechecked	\N
7986	t	tobechecked	\N
7989	t	tobechecked	\N
7992	t	tobechecked	\N
7995	t	tobechecked	\N
7998	t	tobechecked	\N
8001	t	tobechecked	\N
8004	t	tobechecked	\N
8007	t	tobechecked	\N
8010	t	tobechecked	\N
8013	t	tobechecked	\N
8016	t	tobechecked	\N
8019	t	tobechecked	\N
8021	t	tobechecked	\N
8024	t	tobechecked	\N
8027	t	tobechecked	\N
8030	t	tobechecked	\N
8033	t	tobechecked	\N
8036	t	tobechecked	\N
8039	t	tobechecked	\N
8042	t	tobechecked	\N
8045	t	tobechecked	\N
8048	t	tobechecked	\N
8051	t	tobechecked	\N
8054	t	tobechecked	\N
8057	t	tobechecked	\N
8060	t	tobechecked	\N
8063	t	tobechecked	\N
8065	t	tobechecked	\N
8068	t	tobechecked	\N
8071	t	tobechecked	\N
8074	t	tobechecked	\N
8077	t	tobechecked	\N
8080	t	tobechecked	\N
8083	t	tobechecked	\N
8086	t	tobechecked	\N
8089	t	tobechecked	\N
8092	t	tobechecked	\N
8095	t	tobechecked	\N
8098	t	tobechecked	\N
8101	t	tobechecked	\N
8104	t	tobechecked	\N
8107	t	tobechecked	\N
8110	t	tobechecked	\N
8113	t	tobechecked	\N
8116	t	tobechecked	\N
8119	t	tobechecked	\N
8122	t	tobechecked	\N
8125	t	tobechecked	\N
8128	t	tobechecked	\N
8131	t	tobechecked	\N
8134	t	tobechecked	\N
8137	t	tobechecked	\N
8140	t	tobechecked	\N
8143	t	tobechecked	\N
8146	t	tobechecked	\N
8149	t	tobechecked	\N
8152	t	tobechecked	\N
8155	t	tobechecked	\N
8158	t	tobechecked	\N
8161	t	tobechecked	\N
8164	t	tobechecked	\N
8167	t	tobechecked	\N
8170	t	tobechecked	\N
8173	t	tobechecked	\N
8176	t	tobechecked	\N
8179	t	tobechecked	\N
8182	t	tobechecked	\N
8185	t	tobechecked	\N
8188	t	tobechecked	\N
8191	t	tobechecked	\N
8194	t	tobechecked	\N
8197	t	tobechecked	\N
8200	t	tobechecked	\N
8203	t	tobechecked	\N
8206	t	tobechecked	\N
8209	t	tobechecked	\N
8212	t	tobechecked	\N
8215	t	tobechecked	\N
8218	t	tobechecked	\N
8221	t	tobechecked	\N
8224	t	tobechecked	\N
8227	t	tobechecked	\N
8230	t	tobechecked	\N
8233	t	tobechecked	\N
8236	t	tobechecked	\N
8239	t	tobechecked	\N
8242	t	tobechecked	\N
8245	t	tobechecked	\N
8248	t	tobechecked	\N
8251	t	tobechecked	\N
8254	t	tobechecked	\N
8257	t	tobechecked	\N
8260	t	tobechecked	\N
8263	t	tobechecked	\N
8266	t	tobechecked	\N
8269	t	tobechecked	\N
8272	t	tobechecked	\N
8275	t	tobechecked	\N
8278	t	tobechecked	\N
8281	t	tobechecked	\N
8284	t	tobechecked	\N
8287	t	tobechecked	\N
8290	t	tobechecked	\N
8293	t	tobechecked	\N
8296	t	tobechecked	\N
8299	t	tobechecked	\N
8302	t	tobechecked	\N
8305	t	tobechecked	\N
8308	t	tobechecked	\N
8311	t	tobechecked	\N
8748	t	tobechecked	\N
8750	t	tobechecked	\N
8752	t	tobechecked	\N
8754	t	tobechecked	\N
8756	t	tobechecked	\N
8758	t	tobechecked	\N
8760	t	tobechecked	\N
8762	t	tobechecked	\N
8764	t	tobechecked	\N
8766	t	tobechecked	\N
8768	t	tobechecked	\N
8770	t	tobechecked	\N
8772	t	tobechecked	\N
8774	t	tobechecked	\N
8776	t	tobechecked	\N
8806	f	tobechecked	\N
8808	f	tobechecked	\N
8820	f	tobechecked	\N
8824	t	tobechecked	\N
8826	t	tobechecked	\N
8828	t	tobechecked	\N
8830	t	tobechecked	\N
8332	t	approved	\N
8352	t	approved	\N
8372	t	tobechecked	\N
8400	t	tobechecked	\N
8348	t	approved	\N
8414	t	tobechecked	\N
8584	t	tobechecked	\N
8404	t	tobechecked	\N
8498	t	approved	\N
8380	t	tobechecked	\N
8506	t	approved	\N
8502	t	approved	\N
8500	t	approved	\N
8382	t	tobechecked	\N
8504	t	approved	\N
8526	t	tobechecked	\N
8496	t	approved	\N
8514	t	approved	\N
8510	t	approved	\N
8508	t	approved	\N
8512	t	approved	\N
8354	t	approved	\N
8356	t	approved	\N
8360	t	approved	\N
8362	t	approved	\N
8540	t	approved	\N
8358	t	approved	\N
8466	t	tobechecked	\N
8544	t	approved	\N
8542	t	approved	\N
8452	t	tobechecked	\N
8456	t	tobechecked	\N
8546	t	tobechecked	\N
8548	t	tobechecked	\N
8520	t	approved	\N
8516	t	approved	\N
8518	t	approved	\N
8522	t	approved	\N
8550	t	tobechecked	\N
8528	t	approved	\N
8552	t	tobechecked	\N
8554	t	tobechecked	\N
8468	t	tobechecked	\N
8556	t	tobechecked	\N
8530	t	approved	\N
8558	t	tobechecked	\N
8560	t	tobechecked	\N
8534	t	approved	\N
8434	t	tobechecked	\N
8538	t	approved	\N
8532	t	approved	\N
8562	t	tobechecked	\N
8566	t	tobechecked	\N
8564	t	tobechecked	\N
8568	t	tobechecked	\N
8572	t	tobechecked	\N
8570	t	tobechecked	\N
8574	t	tobechecked	\N
8578	t	tobechecked	\N
8576	t	tobechecked	\N
8536	t	approved	\N
8370	t	approved	\N
8412	t	tobechecked	\N
8472	t	tobechecked	\N
8478	t	tobechecked	\N
8474	t	tobechecked	\N
8476	t	tobechecked	\N
8334	t	approved	\N
8480	t	tobechecked	\N
8482	t	tobechecked	\N
8484	t	tobechecked	\N
8580	t	tobechecked	\N
8582	t	tobechecked	\N
8590	t	tobechecked	\N
8586	t	tobechecked	\N
8588	t	tobechecked	\N
8486	t	tobechecked	\N
8594	t	tobechecked	\N
8596	t	tobechecked	\N
8524	t	approved	\N
8490	t	tobechecked	\N
8488	t	tobechecked	\N
8492	t	tobechecked	\N
8494	t	tobechecked	\N
8612	t	tobechecked	\N
8598	t	tobechecked	\N
8600	t	tobechecked	\N
8602	t	tobechecked	\N
8604	t	tobechecked	\N
8606	t	tobechecked	\N
8608	t	tobechecked	\N
8616	t	tobechecked	\N
8614	t	tobechecked	\N
8622	t	tobechecked	\N
8644	t	tobechecked	\N
8618	t	tobechecked	\N
8620	t	tobechecked	\N
8624	t	tobechecked	\N
8626	t	tobechecked	\N
8630	t	tobechecked	\N
8628	t	tobechecked	\N
8632	t	tobechecked	\N
8634	t	tobechecked	\N
8636	t	tobechecked	\N
8640	t	tobechecked	\N
8642	t	tobechecked	\N
8648	t	tobechecked	\N
8646	t	tobechecked	\N
8652	t	tobechecked	\N
8650	t	tobechecked	\N
8654	t	tobechecked	\N
8656	t	tobechecked	\N
8670	t	tobechecked	\N
8660	t	tobechecked	\N
8662	t	tobechecked	\N
8666	t	tobechecked	\N
8668	t	tobechecked	\N
8672	t	tobechecked	\N
8724	t	tobechecked	\N
8734	t	tobechecked	\N
8730	t	tobechecked	\N
8738	t	tobechecked	\N
8736	t	tobechecked	\N
8428	t	tobechecked	\N
8746	t	tobechecked	\N
8438	t	tobechecked	\N
8440	t	tobechecked	\N
8442	t	tobechecked	\N
8350	t	approved	\N
8832	t	tobechecked	\N
8836	t	tobechecked	\N
8838	t	tobechecked	\N
8840	t	tobechecked	\N
8846	t	tobechecked	\N
8848	t	tobechecked	\N
8850	t	tobechecked	\N
8852	t	tobechecked	\N
8854	t	tobechecked	\N
8862	t	tobechecked	\N
8864	t	tobechecked	\N
8866	t	tobechecked	\N
8870	t	tobechecked	\N
8872	t	tobechecked	\N
8874	t	tobechecked	\N
8876	t	tobechecked	\N
8884	t	tobechecked	\N
8886	t	tobechecked	\N
8888	t	tobechecked	\N
8890	t	tobechecked	\N
8914	t	tobechecked	\N
8920	t	tobechecked	\N
8922	t	tobechecked	\N
8994	f	tobechecked	\N
8996	f	tobechecked	\N
9000	f	tobechecked	\N
9002	f	tobechecked	\N
9004	f	tobechecked	\N
9006	f	tobechecked	\N
9008	t	tobechecked	\N
9010	t	tobechecked	\N
9012	t	tobechecked	\N
9014	t	tobechecked	\N
9064	t	tobechecked	\N
9200	f	tobechecked	\N
9246	t	tobechecked	\N
9256	t	tobechecked	\N
9258	t	tobechecked	\N
9260	t	tobechecked	\N
9262	t	tobechecked	\N
9264	t	tobechecked	\N
9266	t	tobechecked	\N
9268	t	tobechecked	\N
9270	t	tobechecked	\N
9272	t	tobechecked	\N
9274	t	tobechecked	\N
9276	t	tobechecked	\N
9278	t	tobechecked	\N
9378	f	tobechecked	\N
9388	t	tobechecked	\N
9398	t	tobechecked	\N
9404	t	tobechecked	\N
9410	t	tobechecked	\N
9412	t	tobechecked	\N
9460	t	tobechecked	\N
9462	t	tobechecked	\N
9506	f	tobechecked	\N
9562	f	tobechecked	\N
9572	f	tobechecked	\N
9574	t	tobechecked	\N
9584	t	tobechecked	\N
9586	t	tobechecked	\N
9588	f	tobechecked	\N
9590	f	tobechecked	\N
9592	f	tobechecked	\N
9594	f	tobechecked	\N
9596	f	tobechecked	\N
9598	f	tobechecked	\N
9602	f	tobechecked	\N
9604	f	tobechecked	\N
9606	t	tobechecked	\N
9608	t	tobechecked	\N
9610	t	tobechecked	\N
9612	t	tobechecked	\N
9614	t	tobechecked	\N
9616	t	tobechecked	\N
9618	t	tobechecked	\N
9620	t	tobechecked	\N
9622	t	tobechecked	\N
9626	f	tobechecked	\N
9628	t	tobechecked	\N
9630	t	tobechecked	\N
9632	t	tobechecked	\N
9634	t	tobechecked	\N
9636	t	tobechecked	\N
9638	t	tobechecked	\N
9656	t	tobechecked	\N
9658	t	tobechecked	\N
9664	t	tobechecked	\N
9666	t	tobechecked	\N
9726	t	tobechecked	\N
9728	t	tobechecked	\N
9730	t	tobechecked	\N
9732	t	tobechecked	\N
9734	t	tobechecked	\N
9736	t	tobechecked	\N
9740	t	tobechecked	\N
9742	t	tobechecked	\N
9744	t	tobechecked	\N
9746	t	tobechecked	\N
9748	t	tobechecked	\N
9750	t	tobechecked	\N
9752	t	tobechecked	\N
9754	t	tobechecked	\N
9758	t	tobechecked	\N
9760	t	tobechecked	\N
9762	t	tobechecked	\N
9768	t	tobechecked	\N
9814	t	tobechecked	\N
9882	t	tobechecked	\N
9884	t	tobechecked	\N
9888	t	tobechecked	\N
9892	t	tobechecked	\N
9910	t	tobechecked	\N
9912	t	tobechecked	\N
9914	t	tobechecked	\N
9916	t	tobechecked	\N
9918	t	tobechecked	\N
9920	t	tobechecked	\N
9922	t	tobechecked	\N
9924	t	tobechecked	\N
9932	t	tobechecked	\N
9936	t	tobechecked	\N
9942	t	tobechecked	\N
9946	t	tobechecked	\N
9964	t	tobechecked	\N
9966	t	tobechecked	\N
9968	t	tobechecked	\N
10028	t	tobechecked	\N
10102	f	tobechecked	\N
10104	f	tobechecked	\N
10106	f	tobechecked	\N
10108	f	tobechecked	\N
10110	f	tobechecked	\N
10112	f	tobechecked	\N
10114	f	tobechecked	\N
10116	f	tobechecked	\N
10118	f	tobechecked	\N
10120	f	tobechecked	\N
10122	f	tobechecked	\N
10124	t	tobechecked	\N
10132	t	tobechecked	\N
10134	t	tobechecked	\N
10136	t	tobechecked	\N
10138	f	tobechecked	\N
10140	f	tobechecked	\N
10174	t	tobechecked	\N
10176	t	tobechecked	\N
10178	t	tobechecked	\N
10180	t	tobechecked	\N
10182	t	tobechecked	\N
10184	t	tobechecked	\N
10186	t	tobechecked	\N
10188	t	tobechecked	\N
10190	t	tobechecked	\N
10192	t	tobechecked	\N
10194	t	tobechecked	\N
10196	t	tobechecked	\N
10198	f	tobechecked	\N
10200	t	tobechecked	\N
10202	t	tobechecked	\N
10204	t	tobechecked	\N
10206	t	tobechecked	\N
10208	t	tobechecked	\N
10210	t	tobechecked	\N
10212	t	tobechecked	\N
10214	t	tobechecked	\N
10216	t	tobechecked	\N
10218	t	tobechecked	\N
10220	t	tobechecked	\N
10222	t	tobechecked	\N
10224	t	tobechecked	\N
10226	t	tobechecked	\N
10228	t	tobechecked	\N
10230	t	tobechecked	\N
10236	t	tobechecked	\N
10238	t	tobechecked	\N
10240	f	tobechecked	\N
10250	t	tobechecked	\N
10252	t	tobechecked	\N
10254	t	tobechecked	\N
10256	t	tobechecked	\N
10258	t	tobechecked	\N
10262	t	tobechecked	\N
10264	t	tobechecked	\N
10266	t	tobechecked	\N
10270	t	tobechecked	\N
10298	t	tobechecked	\N
10302	f	tobechecked	\N
10304	f	tobechecked	\N
10306	f	tobechecked	\N
10308	f	tobechecked	\N
10310	f	tobechecked	\N
10312	f	tobechecked	\N
10314	f	tobechecked	\N
10324	t	tobechecked	\N
10338	t	tobechecked	\N
10348	t	tobechecked	\N
10350	t	tobechecked	\N
10352	t	tobechecked	\N
10354	t	tobechecked	\N
10356	t	tobechecked	\N
10360	t	tobechecked	\N
10362	t	tobechecked	\N
10364	t	tobechecked	\N
10374	f	tobechecked	\N
10378	t	tobechecked	\N
10382	t	tobechecked	\N
10384	t	tobechecked	\N
10388	t	tobechecked	\N
10392	t	tobechecked	\N
10398	t	tobechecked	\N
10404	t	tobechecked	\N
10408	t	tobechecked	\N
10410	t	tobechecked	\N
10416	t	tobechecked	\N
10420	t	tobechecked	\N
10424	f	tobechecked	\N
10426	f	tobechecked	\N
10438	f	tobechecked	\N
10444	f	tobechecked	\N
10464	t	tobechecked	\N
10470	f	tobechecked	\N
10472	f	tobechecked	\N
10474	t	tobechecked	\N
10478	t	tobechecked	\N
10496	f	tobechecked	\N
10498	f	tobechecked	\N
10530	t	tobechecked	\N
10532	t	tobechecked	\N
10534	t	tobechecked	\N
10536	t	tobechecked	\N
10538	t	tobechecked	\N
10540	t	tobechecked	\N
10542	t	tobechecked	\N
10544	t	tobechecked	\N
10546	t	tobechecked	\N
10548	t	tobechecked	\N
10550	t	tobechecked	\N
10552	t	tobechecked	\N
10554	t	tobechecked	\N
10556	t	tobechecked	\N
10558	t	tobechecked	\N
10560	t	tobechecked	\N
10564	f	tobechecked	\N
10570	t	tobechecked	\N
10586	t	tobechecked	\N
10588	t	tobechecked	\N
10592	f	tobechecked	\N
10602	t	tobechecked	\N
10614	t	tobechecked	\N
10616	t	tobechecked	\N
10618	t	tobechecked	\N
10620	t	tobechecked	\N
10622	f	tobechecked	\N
10624	t	tobechecked	\N
10626	t	tobechecked	\N
10628	t	tobechecked	\N
10630	t	tobechecked	\N
10632	t	tobechecked	\N
10634	t	tobechecked	\N
10636	t	tobechecked	\N
10640	t	tobechecked	\N
10644	t	tobechecked	\N
10648	t	tobechecked	\N
10652	t	tobechecked	\N
10676	t	tobechecked	\N
10684	t	tobechecked	\N
10690	t	tobechecked	\N
10694	t	tobechecked	\N
10696	t	tobechecked	\N
10698	t	tobechecked	\N
10720	t	tobechecked	\N
10728	t	tobechecked	\N
10730	t	tobechecked	\N
10732	t	tobechecked	\N
10766	f	tobechecked	\N
10772	f	tobechecked	\N
10782	f	tobechecked	\N
10784	f	tobechecked	\N
10788	t	tobechecked	\N
10814	t	tobechecked	\N
10818	t	tobechecked	\N
10826	t	tobechecked	\N
10868	t	tobechecked	\N
10870	t	tobechecked	\N
10906	t	tobechecked	\N
10922	t	tobechecked	\N
10924	t	tobechecked	\N
10928	t	tobechecked	\N
10932	t	tobechecked	\N
10950	t	tobechecked	\N
10952	t	tobechecked	\N
10972	f	tobechecked	\N
10990	t	tobechecked	\N
10994	t	tobechecked	\N
11002	t	tobechecked	\N
11004	t	tobechecked	\N
11006	t	tobechecked	\N
11038	t	tobechecked	\N
11040	t	tobechecked	\N
11042	t	tobechecked	\N
11044	t	tobechecked	\N
11046	t	tobechecked	\N
11048	t	tobechecked	\N
11050	t	tobechecked	\N
11052	t	tobechecked	\N
11054	t	tobechecked	\N
11056	t	tobechecked	\N
11058	t	tobechecked	\N
11060	t	tobechecked	\N
11062	t	tobechecked	\N
11064	t	tobechecked	\N
11066	t	tobechecked	\N
11068	t	tobechecked	\N
11070	t	tobechecked	\N
11072	t	tobechecked	\N
11074	t	tobechecked	\N
11076	t	tobechecked	\N
11078	t	tobechecked	\N
11080	t	tobechecked	\N
11082	t	tobechecked	\N
11084	t	tobechecked	\N
11086	t	tobechecked	\N
11088	t	tobechecked	\N
11090	t	tobechecked	\N
11092	t	tobechecked	\N
11094	t	tobechecked	\N
11096	t	tobechecked	\N
11098	t	tobechecked	\N
11100	t	tobechecked	\N
11102	t	tobechecked	\N
11104	t	tobechecked	\N
11106	t	tobechecked	\N
11108	t	tobechecked	\N
11110	t	tobechecked	\N
11112	t	tobechecked	\N
11114	t	tobechecked	\N
11116	t	tobechecked	\N
11118	t	tobechecked	\N
11120	t	tobechecked	\N
11122	t	tobechecked	\N
11124	t	tobechecked	\N
11126	t	tobechecked	\N
11128	t	tobechecked	\N
11130	t	tobechecked	\N
11132	t	tobechecked	\N
11134	t	tobechecked	\N
11136	t	tobechecked	\N
11138	t	tobechecked	\N
11140	t	tobechecked	\N
11142	t	tobechecked	\N
11144	t	tobechecked	\N
11146	t	tobechecked	\N
11148	t	tobechecked	\N
11150	t	tobechecked	\N
11152	t	tobechecked	\N
11154	t	tobechecked	\N
11156	t	tobechecked	\N
11158	t	tobechecked	\N
11160	t	tobechecked	\N
11166	t	tobechecked	\N
11172	t	tobechecked	\N
11174	t	tobechecked	\N
11176	t	tobechecked	\N
11178	t	tobechecked	\N
11180	t	tobechecked	\N
11182	t	tobechecked	\N
11184	t	tobechecked	\N
11186	t	tobechecked	\N
11188	t	tobechecked	\N
11190	t	tobechecked	\N
11249	t	tobechecked	\N
11258	t	tobechecked	\N
11261	t	tobechecked	\N
11297	t	tobechecked	\N
11312	f	tobechecked	\N
11315	f	tobechecked	\N
11318	f	tobechecked	\N
11321	f	tobechecked	\N
11324	f	tobechecked	\N
11393	f	tobechecked	\N
11396	f	tobechecked	\N
11399	f	tobechecked	\N
11402	f	tobechecked	\N
11405	t	tobechecked	\N
11408	t	tobechecked	\N
11426	f	tobechecked	\N
11444	f	tobechecked	\N
11447	t	tobechecked	\N
11450	f	tobechecked	\N
11453	t	tobechecked	\N
11456	t	tobechecked	\N
11459	t	tobechecked	\N
11465	t	tobechecked	\N
11468	f	tobechecked	\N
11471	t	tobechecked	\N
11477	t	tobechecked	\N
11483	t	tobechecked	\N
11486	t	tobechecked	\N
11489	t	tobechecked	\N
11498	f	tobechecked	\N
11501	f	tobechecked	\N
11510	t	tobechecked	\N
11513	t	tobechecked	\N
11519	t	tobechecked	\N
11522	t	tobechecked	\N
11525	t	tobechecked	\N
11528	t	tobechecked	\N
11531	t	tobechecked	\N
11534	t	tobechecked	\N
11537	t	tobechecked	\N
11540	t	tobechecked	\N
11543	t	tobechecked	\N
11546	t	tobechecked	\N
11549	t	tobechecked	\N
11552	t	tobechecked	\N
11573	f	tobechecked	\N
11576	t	tobechecked	\N
11579	t	tobechecked	\N
11582	t	tobechecked	\N
11585	t	tobechecked	\N
42331	t	approved	\N
42323	t	approved	\N
42320	t	approved	\N
42335	t	approved	\N
42332	t	approved	\N
42411	t	approved	\N
42405	t	approved	\N
42415	t	approved	\N
11201	t	tobechecked	\N
11213	t	tobechecked	\N
42333	t	approved	\N
42365	t	approved	\N
42348	t	approved	\N
42346	t	approved	\N
42356	t	approved	\N
42358	t	approved	\N
42357	t	approved	\N
42361	t	approved	\N
42370	t	approved	\N
42369	t	approved	\N
42385	t	approved	\N
42334	t	approved	\N
42373	t	approved	\N
42375	t	approved	\N
42379	t	approved	\N
42389	t	approved	\N
42388	t	approved	\N
42401	t	approved	\N
42398	t	approved	\N
42412	t	approved	\N
11207	t	tobechecked	\N
11231	t	tobechecked	\N
11228	t	tobechecked	\N
11237	t	tobechecked	\N
11234	t	tobechecked	\N
42416	t	approved	\N
11240	t	tobechecked	\N
11243	t	tobechecked	\N
42315	t	approved	\N
11246	t	tobechecked	\N
11210	t	tobechecked	\N
11219	t	tobechecked	\N
11216	t	tobechecked	\N
11222	t	tobechecked	\N
42374	t	approved	\N
42502	f	tobechecked	\N
42519	t	approved	\N
42806	t	approved	\N
42419	t	approved	\N
42800	t	approved	\N
42586	t	approved	\N
42802	t	approved	\N
42780	t	approved	\N
42805	t	approved	\N
42807	t	approved	\N
42588	t	approved	\N
42587	t	approved	\N
42589	t	approved	\N
42592	t	approved	\N
42823	t	approved	\N
42842	t	approved	\N
42812	t	approved	\N
42810	t	approved	\N
42591	t	approved	\N
42811	t	approved	\N
42813	t	approved	\N
42818	t	approved	\N
42815	t	approved	\N
42590	t	approved	\N
42820	t	approved	\N
42593	t	approved	\N
42595	t	approved	\N
42598	t	approved	\N
42600	t	approved	\N
42596	t	approved	\N
42597	t	approved	\N
42602	t	approved	\N
42599	t	approved	\N
42841	t	approved	\N
42808	t	approved	\N
42594	t	approved	\N
42443	t	approved	\N
42421	t	approved	\N
42663	t	approved	\N
42601	t	approved	\N
42457	t	approved	\N
42489	t	approved	\N
42603	t	approved	\N
42607	t	approved	\N
42604	t	approved	\N
42606	t	approved	\N
42673	t	approved	\N
42605	t	approved	\N
42627	t	approved	\N
42670	t	approved	\N
42646	t	approved	\N
42628	t	approved	\N
42422	t	approved	\N
42660	t	approved	\N
42664	t	approved	\N
42662	t	approved	\N
42665	t	approved	\N
42667	t	approved	\N
42661	t	approved	\N
42668	t	approved	\N
42666	t	approved	\N
42669	t	approved	\N
42626	t	approved	\N
42672	t	approved	\N
42671	t	approved	\N
42674	t	approved	\N
42675	t	approved	\N
42676	t	approved	\N
42714	t	approved	\N
42677	t	approved	\N
42702	t	approved	\N
42420	t	approved	\N
42712	t	approved	\N
42713	t	approved	\N
42718	f	approved	\N
42727	t	approved	\N
42719	f	approved	\N
42720	f	approved	\N
42515	t	approved	\N
42703	t	approved	\N
42471	t	approved	\N
42469	t	approved	\N
42493	t	approved	\N
42491	t	approved	\N
42488	t	approved	\N
42459	t	approved	\N
42490	t	approved	\N
42492	t	approved	\N
42497	t	approved	\N
42495	t	approved	\N
42494	t	approved	\N
42496	t	approved	\N
42498	t	approved	\N
42499	t	approved	\N
42500	t	approved	\N
42501	t	approved	\N
42503	t	approved	\N
42505	t	approved	\N
42504	t	approved	\N
42510	t	approved	\N
42517	t	approved	\N
42514	t	approved	\N
42728	t	approved	\N
42742	t	approved	\N
42740	t	approved	\N
42746	t	approved	\N
42743	t	approved	\N
42809	t	approved	\N
42748	f	approved	\N
42750	t	approved	\N
42751	t	approved	\N
42752	t	approved	\N
42738	t	approved	\N
42516	t	approved	\N
42521	t	approved	\N
42529	t	approved	\N
42431	t	approved	\N
42520	t	approved	\N
42524	t	approved	\N
42522	t	approved	\N
42523	t	approved	\N
42518	t	approved	\N
42526	t	approved	\N
42527	t	approved	\N
42528	t	approved	\N
42525	t	approved	\N
42530	t	approved	\N
42533	t	approved	\N
42535	t	approved	\N
42531	t	approved	\N
42532	t	approved	\N
42534	t	approved	\N
42739	t	approved	\N
42785	t	tobechecked	\N
42879	t	approved	\N
42878	t	approved	\N
42921	t	approved	\N
42896	t	approved	\N
42936	t	tobechecked	\N
42882	t	approved	\N
42880	t	approved	\N
42904	t	approved	\N
42908	t	approved	\N
42907	t	approved	\N
42905	t	approved	\N
42930	t	approved	\N
42903	t	approved	\N
42909	t	approved	\N
42911	t	approved	\N
42910	t	approved	\N
43284	t	tobechecked	\N
42877	t	approved	\N
43251	t	tobechecked	\N
43253	t	tobechecked	\N
43267	t	tobechecked	\N
43262	t	tobechecked	\N
43263	t	tobechecked	\N
43269	t	tobechecked	\N
43313	t	tobechecked	\N
43287	t	tobechecked	\N
43156	t	tobechecked	\N
43346	t	tobechecked	\N
43317	t	tobechecked	\N
42993	t	tobechecked	\N
42916	t	approved	\N
42929	t	approved	\N
42931	t	tobechecked	\N
42934	t	tobechecked	\N
42935	t	tobechecked	\N
42933	t	tobechecked	\N
42937	t	tobechecked	\N
42938	t	tobechecked	\N
42912	t	approved	\N
42951	t	tobechecked	\N
42955	t	tobechecked	\N
42940	t	tobechecked	\N
42947	t	tobechecked	\N
42950	t	tobechecked	\N
43090	t	tobechecked	\N
42900	t	approved	\N
43016	t	tobechecked	\N
42990	t	tobechecked	\N
43008	t	tobechecked	\N
43019	t	tobechecked	\N
43018	t	tobechecked	\N
43023	t	tobechecked	\N
43164	t	tobechecked	\N
43033	t	tobechecked	\N
43020	t	tobechecked	\N
43021	t	tobechecked	\N
43022	t	tobechecked	\N
43057	t	tobechecked	\N
43037	t	tobechecked	\N
43035	t	tobechecked	\N
43046	t	tobechecked	\N
43053	t	tobechecked	\N
43048	t	tobechecked	\N
43054	t	tobechecked	\N
43060	t	tobechecked	\N
43061	t	tobechecked	\N
43297	t	tobechecked	\N
43065	t	tobechecked	\N
43146	t	tobechecked	\N
43143	t	tobechecked	\N
43083	t	tobechecked	\N
43216	t	tobechecked	\N
43147	t	tobechecked	\N
43145	t	tobechecked	\N
43162	t	tobechecked	\N
42957	t	tobechecked	\N
43148	t	tobechecked	\N
43160	t	tobechecked	\N
43165	t	tobechecked	\N
43163	t	tobechecked	\N
43169	t	tobechecked	\N
43177	t	tobechecked	\N
43196	t	tobechecked	\N
43185	t	tobechecked	\N
43221	t	tobechecked	\N
43214	t	tobechecked	\N
43212	t	tobechecked	\N
43220	t	tobechecked	\N
43215	t	tobechecked	\N
42881	t	approved	\N
43233	t	tobechecked	\N
43222	t	tobechecked	\N
43232	t	tobechecked	\N
43059	t	tobechecked	\N
43321	t	tobechecked	\N
43234	t	tobechecked	\N
43318	t	tobechecked	\N
43325	t	tobechecked	\N
43326	t	tobechecked	\N
43329	t	tobechecked	\N
43328	t	tobechecked	\N
43327	t	tobechecked	\N
43330	t	tobechecked	\N
43331	t	tobechecked	\N
43333	t	tobechecked	\N
43334	t	tobechecked	\N
43335	t	tobechecked	\N
43340	t	tobechecked	\N
43341	t	tobechecked	\N
43344	t	tobechecked	\N
43342	t	tobechecked	\N
43252	t	tobechecked	\N
43343	t	tobechecked	\N
43347	t	tobechecked	\N
43345	t	tobechecked	\N
43348	t	tobechecked	\N
43349	t	tobechecked	\N
43350	t	tobechecked	\N
43356	t	tobechecked	\N
43357	t	tobechecked	\N
43358	t	tobechecked	\N
43359	t	tobechecked	\N
43360	t	tobechecked	\N
43362	t	tobechecked	\N
43379	t	tobechecked	\N
43365	t	tobechecked	\N
42867	t	approved	\N
43380	t	tobechecked	\N
43381	t	tobechecked	\N
43382	t	tobechecked	\N
43383	t	tobechecked	\N
43398	t	tobechecked	\N
43427	f	tobechecked	\N
43456	t	tobechecked	\N
43457	t	tobechecked	\N
43458	t	tobechecked	\N
43459	t	tobechecked	\N
43460	t	tobechecked	\N
43461	t	tobechecked	\N
43463	t	tobechecked	\N
43465	t	tobechecked	\N
43466	t	tobechecked	\N
43475	t	tobechecked	\N
43468	t	tobechecked	\N
43467	t	tobechecked	\N
43472	t	tobechecked	\N
43471	t	tobechecked	\N
43470	t	tobechecked	\N
43473	t	tobechecked	\N
43474	t	tobechecked	\N
43464	t	tobechecked	\N
43476	t	tobechecked	\N
43477	t	tobechecked	\N
43478	t	tobechecked	\N
43479	t	tobechecked	\N
43480	t	tobechecked	\N
43483	t	tobechecked	\N
43482	t	tobechecked	\N
43484	t	tobechecked	\N
43485	t	tobechecked	\N
43486	t	tobechecked	\N
43487	t	tobechecked	\N
43488	t	tobechecked	\N
43489	t	tobechecked	\N
43490	t	tobechecked	\N
43491	t	tobechecked	\N
43492	t	tobechecked	\N
43493	t	tobechecked	\N
43494	t	tobechecked	\N
43496	t	tobechecked	\N
43497	t	tobechecked	\N
43498	t	tobechecked	\N
43500	t	tobechecked	\N
43454	t	tobechecked	\N
43501	t	tobechecked	\N
43499	t	tobechecked	\N
43502	t	tobechecked	\N
43503	t	tobechecked	\N
43504	t	tobechecked	\N
43505	t	tobechecked	\N
43506	t	tobechecked	\N
43507	t	tobechecked	\N
43509	t	tobechecked	\N
43510	t	tobechecked	\N
43511	t	tobechecked	\N
43512	t	tobechecked	\N
43513	t	tobechecked	\N
43514	t	tobechecked	\N
43516	t	tobechecked	\N
43515	t	tobechecked	\N
43517	t	tobechecked	\N
43518	t	tobechecked	\N
43519	t	tobechecked	\N
43520	t	tobechecked	\N
43524	t	tobechecked	\N
43522	t	tobechecked	\N
43523	t	tobechecked	\N
43525	t	tobechecked	\N
43526	t	tobechecked	\N
43528	t	tobechecked	\N
43527	t	tobechecked	\N
43529	t	tobechecked	\N
43530	t	tobechecked	\N
43531	t	tobechecked	\N
43532	t	tobechecked	\N
43534	t	tobechecked	\N
43535	t	tobechecked	\N
43536	t	tobechecked	\N
43537	t	tobechecked	\N
43538	t	tobechecked	\N
43539	t	tobechecked	\N
43541	t	tobechecked	\N
43540	t	tobechecked	\N
43542	t	tobechecked	\N
43543	t	tobechecked	\N
43547	t	tobechecked	\N
43544	t	tobechecked	\N
43545	t	tobechecked	\N
43552	t	tobechecked	\N
43548	t	tobechecked	\N
43549	t	tobechecked	\N
43550	t	tobechecked	\N
43551	t	tobechecked	\N
43553	t	tobechecked	\N
43554	t	tobechecked	\N
43555	t	tobechecked	\N
43556	t	tobechecked	\N
43563	t	tobechecked	\N
43564	t	tobechecked	\N
43566	t	tobechecked	\N
43568	t	tobechecked	\N
43569	t	tobechecked	\N
43578	t	tobechecked	\N
43577	t	tobechecked	\N
43579	t	tobechecked	\N
43580	t	tobechecked	\N
43581	t	tobechecked	\N
43582	t	tobechecked	\N
43583	t	tobechecked	\N
43584	t	tobechecked	\N
43585	t	tobechecked	\N
43586	t	tobechecked	\N
43588	t	tobechecked	\N
43589	t	tobechecked	\N
43590	t	tobechecked	\N
43591	t	tobechecked	\N
43592	t	tobechecked	\N
43595	t	tobechecked	\N
43594	t	tobechecked	\N
43596	t	tobechecked	\N
43598	t	tobechecked	\N
43597	t	tobechecked	\N
43601	t	tobechecked	\N
43602	t	tobechecked	\N
43611	t	tobechecked	\N
43622	t	tobechecked	\N
43619	t	tobechecked	\N
43623	t	tobechecked	\N
43624	t	tobechecked	\N
43625	t	tobechecked	\N
43626	t	tobechecked	\N
43627	t	tobechecked	\N
43629	t	tobechecked	\N
43630	t	tobechecked	\N
43631	t	tobechecked	\N
43632	t	tobechecked	\N
43636	t	tobechecked	\N
43677	t	tobechecked	\N
43680	t	tobechecked	\N
43855	t	tobechecked	\N
43706	t	tobechecked	\N
43953	t	approved	\N
43954	t	approved	\N
43950	t	approved	\N
43952	t	approved	\N
43955	t	approved	\N
43957	t	approved	\N
43956	t	approved	\N
43951	t	approved	\N
43958	f	approved	\N
43960	t	approved	\N
43959	t	approved	\N
43949	t	approved	\N
43961	t	approved	\N
43965	t	approved	\N
43963	t	approved	\N
43964	t	approved	\N
43966	t	approved	\N
43967	t	approved	\N
43969	t	approved	\N
43968	t	approved	\N
43729	t	tobechecked	\N
43701	t	tobechecked	\N
43710	t	tobechecked	\N
43817	t	tobechecked	\N
43783	t	tobechecked	\N
43728	t	tobechecked	\N
43720	t	tobechecked	\N
43730	t	tobechecked	\N
43735	t	tobechecked	\N
43759	t	tobechecked	\N
43727	t	tobechecked	\N
43775	t	tobechecked	\N
43784	t	tobechecked	\N
43814	t	tobechecked	\N
43825	t	tobechecked	\N
43830	t	tobechecked	\N
43826	t	tobechecked	\N
43827	t	tobechecked	\N
43828	t	tobechecked	\N
43829	t	tobechecked	\N
43831	t	tobechecked	\N
43832	t	tobechecked	\N
43833	t	tobechecked	\N
43834	t	tobechecked	\N
43835	t	tobechecked	\N
43836	t	tobechecked	\N
43837	t	tobechecked	\N
43839	t	tobechecked	\N
43838	t	tobechecked	\N
43840	t	tobechecked	\N
43843	t	tobechecked	\N
43842	t	tobechecked	\N
43844	t	tobechecked	\N
43845	t	tobechecked	\N
43850	t	tobechecked	\N
43846	t	tobechecked	\N
43847	t	tobechecked	\N
43848	t	tobechecked	\N
43849	t	tobechecked	\N
43851	t	tobechecked	\N
43852	t	tobechecked	\N
43858	t	tobechecked	\N
43853	t	tobechecked	\N
43854	t	tobechecked	\N
43857	t	tobechecked	\N
43860	t	tobechecked	\N
43859	t	tobechecked	\N
43861	t	tobechecked	\N
43864	t	tobechecked	\N
43862	t	tobechecked	\N
43863	t	tobechecked	\N
43865	t	tobechecked	\N
43866	t	tobechecked	\N
43868	t	tobechecked	\N
43871	t	tobechecked	\N
43870	t	tobechecked	\N
43874	t	tobechecked	\N
43872	t	tobechecked	\N
43875	t	tobechecked	\N
43873	t	tobechecked	\N
43878	t	tobechecked	\N
43876	t	tobechecked	\N
43877	t	tobechecked	\N
43927	t	tobechecked	\N
43879	t	tobechecked	\N
43881	t	tobechecked	\N
43882	t	tobechecked	\N
43884	t	tobechecked	\N
43898	t	tobechecked	\N
43891	t	tobechecked	\N
43892	t	tobechecked	\N
43893	t	tobechecked	\N
43894	t	tobechecked	\N
43895	t	tobechecked	\N
43896	t	tobechecked	\N
43897	t	tobechecked	\N
43900	t	tobechecked	\N
43899	t	tobechecked	\N
43902	t	tobechecked	\N
43903	t	tobechecked	\N
43904	t	tobechecked	\N
43906	t	tobechecked	\N
43905	t	tobechecked	\N
43907	t	tobechecked	\N
43908	t	tobechecked	\N
43909	t	tobechecked	\N
43910	t	tobechecked	\N
43913	t	tobechecked	\N
43911	t	tobechecked	\N
43912	t	tobechecked	\N
43917	t	tobechecked	\N
43914	t	tobechecked	\N
43916	t	tobechecked	\N
43918	t	tobechecked	\N
43919	t	tobechecked	\N
43923	t	tobechecked	\N
43920	t	tobechecked	\N
43921	t	tobechecked	\N
43922	t	tobechecked	\N
43924	t	tobechecked	\N
43925	t	tobechecked	\N
43926	t	tobechecked	\N
43928	t	tobechecked	\N
43932	t	tobechecked	\N
43929	t	tobechecked	\N
43930	t	tobechecked	\N
43931	t	tobechecked	\N
43933	t	tobechecked	\N
43934	t	tobechecked	\N
43662	t	tobechecked	\N
43935	t	tobechecked	\N
43936	t	tobechecked	\N
43937	t	tobechecked	\N
44151	t	tobechecked	\N
44045	t	tobechecked	\N
44041	t	tobechecked	\N
44049	t	tobechecked	\N
44046	t	tobechecked	\N
44048	t	tobechecked	\N
44040	t	tobechecked	\N
44051	t	tobechecked	\N
44050	t	tobechecked	\N
43971	t	approved	\N
43970	t	approved	\N
43972	t	approved	\N
43973	t	approved	\N
43974	t	approved	\N
44066	t	approved	\N
44067	t	approved	\N
44068	t	approved	\N
44092	t	approved	\N
44069	t	approved	\N
44070	t	approved	\N
44121	t	tobechecked	\N
44072	t	approved	\N
44073	t	approved	\N
44074	t	approved	\N
44093	t	approved	\N
44094	t	approved	\N
44095	t	approved	\N
44075	t	approved	\N
44104	t	approved	\N
44060	t	approved	\N
44106	t	approved	\N
44105	t	approved	\N
44057	t	approved	\N
44058	t	approved	\N
44059	t	approved	\N
44107	t	tobechecked	\N
44061	t	approved	\N
43982	t	approved	\N
44063	t	approved	\N
44064	t	approved	\N
44065	t	approved	\N
44056	t	approved	\N
44109	t	tobechecked	\N
44108	t	tobechecked	\N
44110	t	tobechecked	\N
44062	t	approved	\N
43981	t	approved	\N
44071	t	approved	\N
43989	t	approved	\N
43990	t	approved	\N
43992	t	approved	\N
43991	t	approved	\N
43993	t	approved	\N
43985	t	approved	\N
43994	t	approved	\N
43995	t	approved	\N
43996	t	approved	\N
44134	t	tobechecked	\N
44133	t	tobechecked	\N
44140	t	tobechecked	\N
44138	t	tobechecked	\N
44139	t	tobechecked	\N
44142	t	tobechecked	\N
44141	t	tobechecked	\N
44147	t	tobechecked	\N
44143	t	tobechecked	\N
44144	t	tobechecked	\N
44145	t	tobechecked	\N
44146	t	tobechecked	\N
44155	t	tobechecked	\N
44148	t	tobechecked	\N
44149	t	tobechecked	\N
44150	t	tobechecked	\N
44152	t	tobechecked	\N
44153	t	tobechecked	\N
44160	t	tobechecked	\N
44161	t	tobechecked	\N
44165	t	tobechecked	\N
44163	t	tobechecked	\N
44164	t	tobechecked	\N
44166	t	tobechecked	\N
44167	t	tobechecked	\N
44168	t	tobechecked	\N
44169	t	tobechecked	\N
44170	t	tobechecked	\N
44171	t	tobechecked	\N
44176	t	tobechecked	\N
44172	t	tobechecked	\N
44175	t	tobechecked	\N
44174	t	tobechecked	\N
44179	t	tobechecked	\N
44177	t	tobechecked	\N
44178	t	tobechecked	\N
44180	t	tobechecked	\N
44183	t	tobechecked	\N
44181	t	tobechecked	\N
44182	t	tobechecked	\N
44184	t	tobechecked	\N
44186	t	tobechecked	\N
44185	t	tobechecked	\N
44187	t	tobechecked	\N
44193	t	tobechecked	\N
44188	t	tobechecked	\N
44189	t	tobechecked	\N
44190	t	tobechecked	\N
44191	t	tobechecked	\N
44192	t	tobechecked	\N
44052	t	approved	\N
44053	t	approved	\N
44055	t	approved	\N
44209	t	tobechecked	\N
44194	t	tobechecked	\N
44197	t	tobechecked	\N
44195	t	tobechecked	\N
44199	t	tobechecked	\N
44198	t	tobechecked	\N
44200	t	tobechecked	\N
44201	t	tobechecked	\N
44204	t	tobechecked	\N
44202	t	tobechecked	\N
44203	t	tobechecked	\N
44054	t	approved	\N
44205	t	tobechecked	\N
44207	t	tobechecked	\N
44208	t	tobechecked	\N
44210	t	tobechecked	\N
44215	t	tobechecked	\N
44211	t	tobechecked	\N
44212	t	tobechecked	\N
44213	t	tobechecked	\N
44217	t	tobechecked	\N
44216	t	tobechecked	\N
44218	t	tobechecked	\N
44220	t	tobechecked	\N
44283	t	tobechecked	\N
44436	t	tobechecked	\N
44227	t	tobechecked	\N
44231	t	tobechecked	\N
44228	t	tobechecked	\N
44229	t	tobechecked	\N
44230	t	tobechecked	\N
44232	t	tobechecked	\N
44233	t	tobechecked	\N
44236	t	tobechecked	\N
44234	t	tobechecked	\N
44235	t	tobechecked	\N
44242	t	tobechecked	\N
44237	t	tobechecked	\N
44239	t	tobechecked	\N
44240	t	tobechecked	\N
44241	t	tobechecked	\N
44243	t	tobechecked	\N
44245	t	tobechecked	\N
44244	t	tobechecked	\N
44246	t	tobechecked	\N
44247	t	tobechecked	\N
44348	t	tobechecked	\N
44248	t	tobechecked	\N
44351	t	tobechecked	\N
44349	t	tobechecked	\N
44357	t	tobechecked	\N
44249	t	tobechecked	\N
44356	t	tobechecked	\N
44359	t	tobechecked	\N
44358	t	tobechecked	\N
44252	t	tobechecked	\N
44367	t	tobechecked	\N
44373	t	tobechecked	\N
44250	t	tobechecked	\N
44374	t	tobechecked	\N
44251	t	tobechecked	\N
44376	t	tobechecked	\N
44253	t	tobechecked	\N
44375	t	tobechecked	\N
44377	t	tobechecked	\N
44380	t	tobechecked	\N
44378	t	tobechecked	\N
44379	t	tobechecked	\N
44383	t	tobechecked	\N
44381	t	tobechecked	\N
44382	t	tobechecked	\N
44384	t	tobechecked	\N
44389	t	tobechecked	\N
44385	t	tobechecked	\N
44387	t	tobechecked	\N
44388	t	tobechecked	\N
44390	t	tobechecked	\N
44391	t	tobechecked	\N
44393	t	tobechecked	\N
44392	t	tobechecked	\N
44395	t	tobechecked	\N
44394	t	tobechecked	\N
44396	t	tobechecked	\N
44400	t	tobechecked	\N
44397	t	tobechecked	\N
44398	t	tobechecked	\N
44410	t	tobechecked	\N
44406	t	tobechecked	\N
44412	t	tobechecked	\N
44411	t	tobechecked	\N
44413	t	tobechecked	\N
44417	t	tobechecked	\N
44414	t	tobechecked	\N
44430	t	tobechecked	\N
44429	t	tobechecked	\N
44431	t	tobechecked	\N
44277	t	tobechecked	\N
44432	t	tobechecked	\N
44434	t	tobechecked	\N
44435	t	tobechecked	\N
44255	t	tobechecked	\N
44438	t	tobechecked	\N
44276	t	tobechecked	\N
44439	t	tobechecked	\N
44442	t	tobechecked	\N
44440	t	tobechecked	\N
44284	t	tobechecked	\N
44278	t	tobechecked	\N
44279	t	tobechecked	\N
44280	t	tobechecked	\N
44281	t	tobechecked	\N
44286	t	tobechecked	\N
44285	t	tobechecked	\N
44288	t	tobechecked	\N
44287	t	tobechecked	\N
44451	t	tobechecked	\N
44290	t	tobechecked	\N
44291	t	tobechecked	\N
44452	t	tobechecked	\N
44468	t	tobechecked	\N
44458	t	tobechecked	\N
44464	t	tobechecked	\N
44292	t	tobechecked	\N
44469	t	tobechecked	\N
44296	t	tobechecked	\N
44293	t	tobechecked	\N
44470	t	tobechecked	\N
44298	t	tobechecked	\N
44474	t	tobechecked	\N
44299	t	tobechecked	\N
44301	t	tobechecked	\N
44300	t	tobechecked	\N
44302	t	tobechecked	\N
44305	t	tobechecked	\N
44303	t	tobechecked	\N
44308	t	tobechecked	\N
44306	t	tobechecked	\N
44307	t	tobechecked	\N
44310	t	tobechecked	\N
44309	t	tobechecked	\N
44311	t	tobechecked	\N
44312	t	tobechecked	\N
44313	t	tobechecked	\N
44314	t	tobechecked	\N
44315	t	tobechecked	\N
44318	t	tobechecked	\N
44317	t	tobechecked	\N
44320	t	tobechecked	\N
44319	t	tobechecked	\N
44321	t	tobechecked	\N
44478	t	tobechecked	\N
44322	t	tobechecked	\N
44484	t	tobechecked	\N
44479	t	tobechecked	\N
44482	t	tobechecked	\N
44483	t	tobechecked	\N
44485	t	tobechecked	\N
44489	t	tobechecked	\N
44488	t	tobechecked	\N
44675	t	tobechecked	\N
44676	t	tobechecked	\N
44677	t	tobechecked	\N
44678	t	tobechecked	\N
44679	t	tobechecked	\N
44680	t	tobechecked	\N
44681	t	tobechecked	\N
44682	t	tobechecked	\N
44683	t	tobechecked	\N
44684	t	tobechecked	\N
44685	t	tobechecked	\N
44686	t	tobechecked	\N
44687	t	tobechecked	\N
44688	t	tobechecked	\N
44689	t	tobechecked	\N
44690	t	tobechecked	\N
44691	t	tobechecked	\N
44692	t	tobechecked	\N
44693	t	tobechecked	\N
44694	t	tobechecked	\N
44695	t	tobechecked	\N
44696	t	tobechecked	\N
44697	t	tobechecked	\N
44698	t	tobechecked	\N
44699	t	tobechecked	\N
44700	t	tobechecked	\N
44701	t	tobechecked	\N
44702	t	tobechecked	\N
44703	t	tobechecked	\N
44704	t	tobechecked	\N
44705	t	tobechecked	\N
44706	t	tobechecked	\N
44707	t	tobechecked	\N
44708	t	tobechecked	\N
44709	t	tobechecked	\N
44710	t	tobechecked	\N
44711	t	tobechecked	\N
44712	t	tobechecked	\N
44713	t	tobechecked	\N
44714	t	tobechecked	\N
44715	t	tobechecked	\N
44716	t	tobechecked	\N
44717	f	tobechecked	\N
44718	t	tobechecked	\N
44719	t	tobechecked	\N
44720	t	tobechecked	\N
44725	t	tobechecked	\N
44733	f	tobechecked	\N
44734	f	tobechecked	\N
44735	f	tobechecked	\N
44736	f	tobechecked	\N
44737	f	tobechecked	\N
44738	f	tobechecked	\N
44746	t	tobechecked	\N
44748	t	tobechecked	\N
44749	t	tobechecked	\N
44750	t	tobechecked	\N
44751	t	tobechecked	\N
44752	t	tobechecked	\N
44753	t	tobechecked	\N
44754	t	tobechecked	\N
44755	t	tobechecked	\N
44756	t	tobechecked	\N
44757	t	tobechecked	\N
44758	t	tobechecked	\N
44759	t	tobechecked	\N
44760	t	tobechecked	\N
44761	t	tobechecked	\N
44551	t	tobechecked	\N
44552	t	tobechecked	\N
44553	t	tobechecked	\N
44557	t	tobechecked	\N
44554	t	tobechecked	\N
44555	t	tobechecked	\N
44556	t	tobechecked	\N
44559	t	tobechecked	\N
44558	t	tobechecked	\N
44561	t	tobechecked	\N
44560	t	tobechecked	\N
44563	t	tobechecked	\N
44565	t	tobechecked	\N
44564	t	tobechecked	\N
44571	t	tobechecked	\N
44566	t	tobechecked	\N
44567	t	tobechecked	\N
44568	t	tobechecked	\N
44569	t	tobechecked	\N
44570	t	tobechecked	\N
44572	t	tobechecked	\N
44573	t	tobechecked	\N
44574	t	tobechecked	\N
44578	t	tobechecked	\N
44588	t	tobechecked	\N
44579	t	tobechecked	\N
44586	t	tobechecked	\N
44591	t	tobechecked	\N
44589	t	tobechecked	\N
44590	t	tobechecked	\N
44592	t	tobechecked	\N
44593	t	tobechecked	\N
44597	t	tobechecked	\N
44594	t	tobechecked	\N
44595	t	tobechecked	\N
44601	t	tobechecked	\N
44599	t	tobechecked	\N
44598	t	tobechecked	\N
44600	t	tobechecked	\N
44602	t	tobechecked	\N
44603	t	tobechecked	\N
44608	t	tobechecked	\N
44604	t	tobechecked	\N
44605	t	tobechecked	\N
44607	t	tobechecked	\N
44609	t	tobechecked	\N
44613	t	tobechecked	\N
44610	t	tobechecked	\N
44611	t	tobechecked	\N
44615	t	tobechecked	\N
44614	t	tobechecked	\N
44616	t	tobechecked	\N
44617	t	tobechecked	\N
44620	t	tobechecked	\N
44618	t	tobechecked	\N
44619	t	tobechecked	\N
44623	t	tobechecked	\N
44621	t	tobechecked	\N
44622	t	tobechecked	\N
44627	t	tobechecked	\N
44625	t	tobechecked	\N
44626	t	tobechecked	\N
44631	t	tobechecked	\N
44628	t	tobechecked	\N
44635	t	tobechecked	\N
44640	t	tobechecked	\N
44638	t	tobechecked	\N
44639	t	tobechecked	\N
44642	t	tobechecked	\N
44641	t	tobechecked	\N
44646	t	tobechecked	\N
44643	t	tobechecked	\N
44660	t	tobechecked	\N
44652	t	tobechecked	\N
44668	t	tobechecked	\N
44671	t	tobechecked	\N
44669	t	tobechecked	\N
44670	t	tobechecked	\N
44672	t	tobechecked	\N
44674	t	tobechecked	\N
44673	t	tobechecked	\N
44762	t	tobechecked	\N
44763	t	tobechecked	\N
44764	t	tobechecked	\N
44765	t	tobechecked	\N
44766	t	tobechecked	\N
44767	t	tobechecked	\N
44768	t	tobechecked	\N
44769	t	tobechecked	\N
44770	t	tobechecked	\N
44771	t	tobechecked	\N
44772	t	tobechecked	\N
44773	t	tobechecked	\N
44774	t	tobechecked	\N
44775	t	tobechecked	\N
44776	t	tobechecked	\N
44777	t	tobechecked	\N
44778	t	tobechecked	\N
44779	t	tobechecked	\N
44780	t	tobechecked	\N
44781	t	tobechecked	\N
44782	t	tobechecked	\N
44783	t	tobechecked	\N
44784	t	tobechecked	\N
44785	t	tobechecked	\N
44786	t	tobechecked	\N
44787	t	tobechecked	\N
44788	t	tobechecked	\N
44789	t	tobechecked	\N
44790	t	tobechecked	\N
44791	t	tobechecked	\N
44792	t	tobechecked	\N
44793	t	tobechecked	\N
44794	t	tobechecked	\N
44795	t	tobechecked	\N
44796	t	tobechecked	\N
44797	t	tobechecked	\N
44798	t	tobechecked	\N
44799	t	tobechecked	\N
44800	t	tobechecked	\N
44801	t	tobechecked	\N
44802	t	tobechecked	\N
44803	t	tobechecked	\N
44804	t	tobechecked	\N
44805	t	tobechecked	\N
44806	t	tobechecked	\N
44807	t	tobechecked	\N
44808	t	tobechecked	\N
44809	f	tobechecked	\N
44810	t	tobechecked	\N
44811	f	tobechecked	\N
44812	t	tobechecked	\N
44813	f	tobechecked	\N
44814	f	tobechecked	\N
44815	f	tobechecked	\N
44816	f	tobechecked	\N
44817	f	tobechecked	\N
44818	t	tobechecked	\N
44819	t	tobechecked	\N
44820	t	tobechecked	\N
44821	t	tobechecked	\N
44822	t	tobechecked	\N
44823	t	tobechecked	\N
44824	t	tobechecked	\N
44825	t	tobechecked	\N
44826	t	tobechecked	\N
44827	f	tobechecked	\N
44828	f	tobechecked	\N
44829	f	tobechecked	\N
44830	t	tobechecked	\N
44831	f	tobechecked	\N
44832	f	tobechecked	\N
44833	f	tobechecked	\N
44834	f	tobechecked	\N
44835	t	tobechecked	\N
44838	f	tobechecked	\N
44839	f	tobechecked	\N
44840	f	tobechecked	\N
44841	f	tobechecked	\N
44842	f	tobechecked	\N
44843	f	tobechecked	\N
44844	f	tobechecked	\N
44845	f	tobechecked	\N
44846	f	tobechecked	\N
44847	f	tobechecked	\N
44848	t	tobechecked	\N
44849	f	tobechecked	\N
44850	f	tobechecked	\N
44851	f	tobechecked	\N
44852	f	tobechecked	\N
44865	t	tobechecked	\N
44866	t	tobechecked	\N
44867	t	tobechecked	\N
44868	t	tobechecked	\N
44869	t	tobechecked	\N
44870	t	tobechecked	\N
44871	t	tobechecked	\N
44872	t	tobechecked	\N
44882	f	tobechecked	\N
44883	f	tobechecked	\N
44884	f	tobechecked	\N
44885	f	tobechecked	\N
44886	t	tobechecked	\N
44887	f	tobechecked	\N
44888	f	tobechecked	\N
44889	f	tobechecked	\N
44890	f	tobechecked	\N
44891	f	tobechecked	\N
44905	t	tobechecked	\N
44906	t	tobechecked	\N
44907	t	tobechecked	\N
44908	t	tobechecked	\N
44909	t	tobechecked	\N
44911	t	tobechecked	\N
44913	t	tobechecked	\N
44924	f	tobechecked	\N
44930	t	tobechecked	\N
44931	t	tobechecked	\N
44946	t	tobechecked	\N
44947	f	tobechecked	\N
44976	t	tobechecked	\N
44990	t	tobechecked	\N
44991	t	tobechecked	\N
44995	t	tobechecked	\N
44996	t	tobechecked	\N
44997	t	tobechecked	\N
45012	t	tobechecked	\N
45015	t	tobechecked	\N
45026	f	tobechecked	\N
45036	t	tobechecked	\N
45037	t	tobechecked	\N
45039	t	tobechecked	\N
45042	t	tobechecked	\N
45046	t	tobechecked	\N
45049	t	tobechecked	\N
45050	t	tobechecked	\N
45051	t	tobechecked	\N
45052	t	tobechecked	\N
45053	t	tobechecked	\N
45054	t	tobechecked	\N
45055	t	tobechecked	\N
45056	t	tobechecked	\N
45057	t	tobechecked	\N
45058	t	tobechecked	\N
45059	t	tobechecked	\N
45060	t	tobechecked	\N
45061	t	tobechecked	\N
45062	t	tobechecked	\N
45063	t	tobechecked	\N
45064	t	tobechecked	\N
45065	t	tobechecked	\N
45066	t	tobechecked	\N
45067	t	tobechecked	\N
45068	t	tobechecked	\N
45069	t	tobechecked	\N
45070	t	tobechecked	\N
45071	t	tobechecked	\N
45072	t	tobechecked	\N
45073	t	tobechecked	\N
45074	t	tobechecked	\N
45075	t	tobechecked	\N
45076	t	tobechecked	\N
45077	t	tobechecked	\N
45078	t	tobechecked	\N
45079	t	tobechecked	\N
45080	t	tobechecked	\N
45081	t	tobechecked	\N
45082	t	tobechecked	\N
45083	t	tobechecked	\N
45084	t	tobechecked	\N
45085	t	tobechecked	\N
45086	t	tobechecked	\N
45087	t	tobechecked	\N
45088	t	tobechecked	\N
45089	t	tobechecked	\N
45090	t	tobechecked	\N
45091	t	tobechecked	\N
45092	t	tobechecked	\N
45093	t	tobechecked	\N
45094	t	tobechecked	\N
45095	t	tobechecked	\N
45096	t	tobechecked	\N
45097	t	tobechecked	\N
45098	t	tobechecked	\N
45099	t	tobechecked	\N
45100	t	tobechecked	\N
45101	t	tobechecked	\N
45102	t	tobechecked	\N
45103	t	tobechecked	\N
45104	t	tobechecked	\N
45105	t	tobechecked	\N
45106	t	tobechecked	\N
45107	t	tobechecked	\N
45108	t	tobechecked	\N
45109	t	tobechecked	\N
45110	t	tobechecked	\N
45111	t	tobechecked	\N
45112	t	tobechecked	\N
45113	t	tobechecked	\N
45115	t	tobechecked	\N
45116	t	tobechecked	\N
45117	t	tobechecked	\N
45118	t	tobechecked	\N
45119	t	tobechecked	\N
45120	f	tobechecked	\N
45121	f	tobechecked	\N
45122	t	tobechecked	\N
45123	t	tobechecked	\N
45124	f	tobechecked	\N
45125	f	tobechecked	\N
45126	f	tobechecked	\N
45139	t	tobechecked	\N
45140	t	tobechecked	\N
45141	t	tobechecked	\N
45143	t	tobechecked	\N
45144	t	tobechecked	\N
45145	t	tobechecked	\N
45146	t	tobechecked	\N
45147	f	tobechecked	\N
45148	t	tobechecked	\N
45149	t	tobechecked	\N
45150	t	tobechecked	\N
45151	f	tobechecked	\N
45152	t	tobechecked	\N
45153	t	tobechecked	\N
45154	t	tobechecked	\N
45155	t	tobechecked	\N
45156	t	tobechecked	\N
45157	t	tobechecked	\N
45158	t	tobechecked	\N
45159	t	tobechecked	\N
45160	t	tobechecked	\N
45161	t	tobechecked	\N
45162	t	tobechecked	\N
45163	t	tobechecked	\N
45164	t	tobechecked	\N
45165	t	tobechecked	\N
45169	t	tobechecked	\N
45207	t	tobechecked	\N
45217	t	tobechecked	\N
45218	t	tobechecked	\N
45232	t	tobechecked	\N
45233	t	tobechecked	\N
45238	t	tobechecked	\N
45260	t	tobechecked	\N
45293	f	tobechecked	\N
45294	t	tobechecked	\N
45307	t	tobechecked	\N
45310	t	tobechecked	\N
45321	t	tobechecked	\N
45322	t	tobechecked	\N
45323	t	tobechecked	\N
45324	t	tobechecked	\N
45325	t	tobechecked	\N
45326	t	tobechecked	\N
45327	t	tobechecked	\N
45328	t	tobechecked	\N
45329	t	tobechecked	\N
45344	t	tobechecked	\N
45348	t	tobechecked	\N
45359	f	tobechecked	\N
45360	f	tobechecked	\N
45361	f	tobechecked	\N
45362	f	tobechecked	\N
45368	f	tobechecked	\N
45369	f	tobechecked	\N
45370	f	tobechecked	\N
45371	f	tobechecked	\N
45372	f	tobechecked	\N
45373	f	tobechecked	\N
45374	f	tobechecked	\N
45375	f	tobechecked	\N
45376	f	tobechecked	\N
45377	f	tobechecked	\N
45378	f	tobechecked	\N
45379	f	tobechecked	\N
45401	t	tobechecked	\N
45403	t	tobechecked	\N
45404	t	tobechecked	\N
45405	t	tobechecked	\N
45406	t	tobechecked	\N
45407	t	tobechecked	\N
45408	t	tobechecked	\N
45410	t	tobechecked	\N
45412	t	tobechecked	\N
45418	t	tobechecked	\N
45419	t	tobechecked	\N
45420	t	tobechecked	\N
45422	t	tobechecked	\N
45423	t	tobechecked	\N
45424	t	tobechecked	\N
45425	t	tobechecked	\N
45426	t	tobechecked	\N
45427	t	tobechecked	\N
45428	t	tobechecked	\N
45429	t	tobechecked	\N
45430	t	tobechecked	\N
45431	t	tobechecked	\N
45432	t	tobechecked	\N
45433	t	tobechecked	\N
45434	t	tobechecked	\N
45435	t	tobechecked	\N
45436	t	tobechecked	\N
45437	t	tobechecked	\N
45438	f	tobechecked	\N
45439	f	tobechecked	\N
45440	t	tobechecked	\N
45441	t	tobechecked	\N
45442	t	tobechecked	\N
45443	t	tobechecked	\N
45444	t	tobechecked	\N
45445	t	tobechecked	\N
45446	t	tobechecked	\N
45447	t	tobechecked	\N
45448	t	tobechecked	\N
45449	t	tobechecked	\N
45450	t	tobechecked	\N
45451	t	tobechecked	\N
45452	t	tobechecked	\N
45454	t	tobechecked	\N
45455	t	tobechecked	\N
45456	t	tobechecked	\N
45458	t	tobechecked	\N
45459	t	tobechecked	\N
45463	t	tobechecked	\N
45495	t	tobechecked	\N
45496	t	tobechecked	\N
45503	t	tobechecked	\N
45504	t	tobechecked	\N
45511	f	tobechecked	\N
45513	t	tobechecked	\N
45521	t	tobechecked	\N
45522	t	tobechecked	\N
45523	f	tobechecked	\N
45524	f	tobechecked	\N
45529	f	tobechecked	\N
45530	t	tobechecked	\N
45531	t	tobechecked	\N
45532	t	tobechecked	\N
45538	t	tobechecked	\N
45539	t	tobechecked	\N
45544	t	tobechecked	\N
45545	t	tobechecked	\N
45547	f	tobechecked	\N
45553	t	tobechecked	\N
45559	t	tobechecked	\N
45571	t	tobechecked	\N
45574	t	tobechecked	\N
45575	t	tobechecked	\N
45576	t	tobechecked	\N
45577	t	tobechecked	\N
45578	t	tobechecked	\N
45579	t	tobechecked	\N
45580	t	tobechecked	\N
45581	t	tobechecked	\N
45582	t	tobechecked	\N
45583	t	tobechecked	\N
45589	f	tobechecked	\N
45590	f	tobechecked	\N
45597	f	tobechecked	\N
45611	f	tobechecked	\N
45615	f	tobechecked	\N
45618	f	tobechecked	\N
45663	f	tobechecked	\N
45664	f	tobechecked	\N
45686	f	tobechecked	\N
45718	f	tobechecked	\N
45725	t	tobechecked	\N
45728	t	tobechecked	\N
45732	t	tobechecked	\N
45747	t	tobechecked	\N
45750	t	tobechecked	\N
45751	t	tobechecked	\N
45752	t	tobechecked	\N
45753	t	tobechecked	\N
45754	t	tobechecked	\N
45755	t	tobechecked	\N
45756	t	tobechecked	\N
45757	t	tobechecked	\N
45758	t	tobechecked	\N
45759	t	tobechecked	\N
45800	f	tobechecked	\N
45821	t	tobechecked	\N
45836	t	tobechecked	\N
45837	t	tobechecked	\N
45838	t	tobechecked	\N
45839	t	tobechecked	\N
45840	t	tobechecked	\N
45841	t	tobechecked	\N
45842	t	tobechecked	\N
45843	t	tobechecked	\N
45844	t	tobechecked	\N
45845	t	tobechecked	\N
45846	t	tobechecked	\N
45847	t	tobechecked	\N
45848	t	tobechecked	\N
45849	t	tobechecked	\N
45850	t	tobechecked	\N
45851	t	tobechecked	\N
45852	t	tobechecked	\N
45853	t	tobechecked	\N
45859	t	tobechecked	\N
45880	t	tobechecked	\N
45881	t	tobechecked	\N
45882	t	tobechecked	\N
45883	t	tobechecked	\N
45884	t	tobechecked	\N
45885	t	tobechecked	\N
45886	t	tobechecked	\N
45887	t	tobechecked	\N
45888	t	tobechecked	\N
45889	t	tobechecked	\N
45890	t	tobechecked	\N
45891	t	tobechecked	\N
45892	t	tobechecked	\N
45893	t	tobechecked	\N
45894	t	tobechecked	\N
45895	t	tobechecked	\N
45896	t	tobechecked	\N
45897	t	tobechecked	\N
45898	t	tobechecked	\N
45899	t	tobechecked	\N
45900	t	tobechecked	\N
45901	t	tobechecked	\N
45902	t	tobechecked	\N
45903	t	tobechecked	\N
45904	t	tobechecked	\N
45905	t	tobechecked	\N
45906	t	tobechecked	\N
45907	t	tobechecked	\N
45908	t	tobechecked	\N
45909	t	tobechecked	\N
45910	t	tobechecked	\N
45911	t	tobechecked	\N
45912	t	tobechecked	\N
45913	t	tobechecked	\N
45914	t	tobechecked	\N
45915	t	tobechecked	\N
45916	t	tobechecked	\N
45917	t	tobechecked	\N
45918	t	tobechecked	\N
45919	t	tobechecked	\N
45920	t	tobechecked	\N
45921	t	tobechecked	\N
45922	t	tobechecked	\N
45923	t	tobechecked	\N
45924	t	tobechecked	\N
45925	t	tobechecked	\N
45926	t	tobechecked	\N
45927	t	tobechecked	\N
45928	t	tobechecked	\N
45929	t	tobechecked	\N
45930	t	tobechecked	\N
45931	t	tobechecked	\N
45932	t	tobechecked	\N
45933	t	tobechecked	\N
45934	t	tobechecked	\N
45935	t	tobechecked	\N
45936	t	tobechecked	\N
45937	t	tobechecked	\N
45938	t	tobechecked	\N
45939	t	tobechecked	\N
45940	t	tobechecked	\N
45941	t	tobechecked	\N
45942	t	tobechecked	\N
45943	t	tobechecked	\N
45944	t	tobechecked	\N
45946	t	tobechecked	\N
45947	t	tobechecked	\N
45948	t	tobechecked	\N
45949	t	tobechecked	\N
45950	t	tobechecked	\N
45951	t	tobechecked	\N
45952	t	tobechecked	\N
45953	t	tobechecked	\N
45954	t	tobechecked	\N
45955	t	tobechecked	\N
45956	t	tobechecked	\N
45963	t	tobechecked	\N
45993	t	tobechecked	\N
46001	t	tobechecked	\N
46003	t	tobechecked	\N
46023	f	tobechecked	\N
46040	t	tobechecked	\N
46041	f	tobechecked	\N
46057	f	tobechecked	\N
46059	f	tobechecked	\N
46072	t	tobechecked	\N
46073	t	tobechecked	\N
46074	t	tobechecked	\N
46075	t	tobechecked	\N
46076	t	tobechecked	\N
46077	t	tobechecked	\N
46078	t	tobechecked	\N
46079	t	tobechecked	\N
46080	t	tobechecked	\N
46082	t	tobechecked	\N
46083	t	tobechecked	\N
46084	t	tobechecked	\N
46085	t	tobechecked	\N
46086	t	tobechecked	\N
46088	f	tobechecked	\N
46093	f	tobechecked	\N
46106	t	tobechecked	\N
46107	t	tobechecked	\N
46124	f	tobechecked	\N
46128	t	tobechecked	\N
46129	t	tobechecked	\N
46130	t	tobechecked	\N
46131	t	tobechecked	\N
46132	t	tobechecked	\N
46133	t	tobechecked	\N
46134	t	tobechecked	\N
46135	t	tobechecked	\N
46136	t	tobechecked	\N
46137	f	tobechecked	\N
46154	t	tobechecked	\N
46156	t	tobechecked	\N
46157	t	tobechecked	\N
46158	t	tobechecked	\N
46159	t	tobechecked	\N
46160	t	tobechecked	\N
46161	t	tobechecked	\N
46162	t	tobechecked	\N
46163	t	tobechecked	\N
46164	t	tobechecked	\N
46165	t	tobechecked	\N
46166	t	tobechecked	\N
46167	t	tobechecked	\N
46168	t	tobechecked	\N
46169	t	tobechecked	\N
46170	t	tobechecked	\N
46172	t	tobechecked	\N
46173	t	tobechecked	\N
46174	t	tobechecked	\N
46175	t	tobechecked	\N
46176	t	tobechecked	\N
46226	f	tobechecked	\N
46239	t	tobechecked	\N
46240	t	tobechecked	\N
46270	f	tobechecked	\N
46276	f	tobechecked	\N
46280	f	tobechecked	\N
46281	f	tobechecked	\N
46285	f	tobechecked	\N
46314	f	tobechecked	\N
46339	f	tobechecked	\N
46361	f	tobechecked	\N
46388	t	tobechecked	\N
46389	t	tobechecked	\N
46390	t	tobechecked	\N
46391	t	tobechecked	\N
46392	t	tobechecked	\N
46393	t	tobechecked	\N
46394	t	tobechecked	\N
46395	t	tobechecked	\N
46396	t	tobechecked	\N
46397	t	tobechecked	\N
46398	t	tobechecked	\N
46399	t	tobechecked	\N
46400	t	tobechecked	\N
46401	t	tobechecked	\N
46402	t	tobechecked	\N
46405	t	tobechecked	\N
46406	t	tobechecked	\N
46407	t	tobechecked	\N
46408	t	tobechecked	\N
46409	t	tobechecked	\N
46410	t	tobechecked	\N
46411	t	tobechecked	\N
46412	t	tobechecked	\N
46413	t	tobechecked	\N
46414	t	tobechecked	\N
46415	t	tobechecked	\N
46435	f	tobechecked	\N
46447	t	tobechecked	\N
46448	t	tobechecked	\N
46449	t	tobechecked	\N
46450	t	tobechecked	\N
46451	t	tobechecked	\N
46452	t	tobechecked	\N
46453	t	tobechecked	\N
46454	t	tobechecked	\N
46455	t	tobechecked	\N
46456	t	tobechecked	\N
46457	t	tobechecked	\N
46458	t	tobechecked	\N
46459	t	tobechecked	\N
46479	t	tobechecked	\N
46480	t	tobechecked	\N
46481	t	tobechecked	\N
46482	t	tobechecked	\N
46483	t	tobechecked	\N
46487	t	tobechecked	\N
46492	t	tobechecked	\N
46503	t	tobechecked	\N
46504	t	tobechecked	\N
46505	t	tobechecked	\N
46506	t	tobechecked	\N
46507	t	tobechecked	\N
46508	t	tobechecked	\N
46509	t	tobechecked	\N
46510	t	tobechecked	\N
46511	t	tobechecked	\N
46512	f	tobechecked	\N
46522	t	tobechecked	\N
46523	t	tobechecked	\N
46524	t	tobechecked	\N
46525	t	tobechecked	\N
46526	t	tobechecked	\N
46527	t	tobechecked	\N
46528	t	tobechecked	\N
46529	t	tobechecked	\N
46530	t	tobechecked	\N
46531	t	tobechecked	\N
46532	t	tobechecked	\N
46533	t	tobechecked	\N
46534	t	tobechecked	\N
46535	t	tobechecked	\N
46536	t	tobechecked	\N
46537	t	tobechecked	\N
46538	t	tobechecked	\N
46539	t	tobechecked	\N
46542	t	tobechecked	\N
46543	t	tobechecked	\N
46544	t	tobechecked	\N
46545	t	tobechecked	\N
46546	t	tobechecked	\N
46547	t	tobechecked	\N
46548	t	tobechecked	\N
46549	t	tobechecked	\N
46550	t	tobechecked	\N
46551	t	tobechecked	\N
46552	t	tobechecked	\N
46553	t	tobechecked	\N
46554	t	tobechecked	\N
46555	t	tobechecked	\N
46556	t	tobechecked	\N
46557	t	tobechecked	\N
46558	t	tobechecked	\N
46559	t	tobechecked	\N
46560	t	tobechecked	\N
46561	t	tobechecked	\N
46562	t	tobechecked	\N
46563	t	tobechecked	\N
46564	t	tobechecked	\N
46565	t	tobechecked	\N
46566	t	tobechecked	\N
46567	t	tobechecked	\N
46568	t	tobechecked	\N
46632	f	tobechecked	\N
46648	f	tobechecked	\N
46690	t	tobechecked	\N
46691	t	tobechecked	\N
46692	t	tobechecked	\N
46693	t	tobechecked	\N
46694	t	tobechecked	\N
46695	t	tobechecked	\N
46696	t	tobechecked	\N
46697	t	tobechecked	\N
46698	t	tobechecked	\N
46699	t	tobechecked	\N
46700	t	tobechecked	\N
46701	t	tobechecked	\N
46702	t	tobechecked	\N
46703	t	tobechecked	\N
46704	t	tobechecked	\N
46705	t	tobechecked	\N
46706	t	tobechecked	\N
46707	t	tobechecked	\N
46708	t	tobechecked	\N
46709	t	tobechecked	\N
46710	t	tobechecked	\N
46711	t	tobechecked	\N
46720	t	tobechecked	\N
46733	t	tobechecked	\N
46743	t	tobechecked	\N
46755	t	tobechecked	\N
46773	t	tobechecked	\N
46789	t	tobechecked	\N
46807	t	tobechecked	\N
46814	f	tobechecked	\N
46817	t	tobechecked	\N
46820	t	tobechecked	\N
46838	t	tobechecked	\N
46842	t	tobechecked	\N
46868	t	tobechecked	\N
46873	t	tobechecked	\N
46884	t	tobechecked	\N
46900	t	tobechecked	\N
46901	t	tobechecked	\N
46902	t	tobechecked	\N
46907	t	tobechecked	\N
46908	t	tobechecked	\N
46909	t	tobechecked	\N
46910	t	tobechecked	\N
46911	t	tobechecked	\N
46912	t	tobechecked	\N
46913	t	tobechecked	\N
46914	t	tobechecked	\N
46915	t	tobechecked	\N
46916	t	tobechecked	\N
46917	t	tobechecked	\N
46918	t	tobechecked	\N
46934	t	tobechecked	\N
46971	t	tobechecked	\N
47015	t	tobechecked	\N
47022	t	tobechecked	\N
47073	t	tobechecked	\N
47082	t	tobechecked	\N
47107	t	tobechecked	\N
47108	t	tobechecked	\N
47109	t	tobechecked	\N
47111	f	tobechecked	\N
47120	t	tobechecked	\N
47122	t	tobechecked	\N
47135	t	tobechecked	\N
47137	t	tobechecked	\N
47140	t	tobechecked	\N
47143	t	tobechecked	\N
47146	t	tobechecked	\N
47161	f	tobechecked	\N
47164	f	tobechecked	\N
47208	f	tobechecked	\N
47209	f	tobechecked	\N
47211	t	tobechecked	\N
47212	t	tobechecked	\N
47221	t	tobechecked	\N
47222	t	tobechecked	\N
47223	t	tobechecked	\N
47226	t	tobechecked	\N
47227	t	tobechecked	\N
47228	t	tobechecked	\N
47229	t	tobechecked	\N
47230	t	tobechecked	\N
47231	t	tobechecked	\N
47232	t	tobechecked	\N
47233	t	tobechecked	\N
47234	t	tobechecked	\N
47261	t	tobechecked	\N
47262	t	tobechecked	\N
47266	f	tobechecked	\N
47275	t	tobechecked	\N
47282	t	tobechecked	\N
47299	f	tobechecked	\N
47300	f	tobechecked	\N
47301	t	tobechecked	\N
47302	t	tobechecked	\N
47306	t	tobechecked	\N
47307	t	tobechecked	\N
47308	t	tobechecked	\N
47309	t	tobechecked	\N
47310	t	tobechecked	\N
47311	t	tobechecked	\N
47312	t	tobechecked	\N
47313	t	tobechecked	\N
47323	t	tobechecked	\N
47358	t	tobechecked	\N
47381	f	tobechecked	\N
47398	t	tobechecked	\N
47410	t	tobechecked	\N
47458	t	tobechecked	\N
47493	t	tobechecked	\N
47494	t	tobechecked	\N
47495	t	tobechecked	\N
47518	t	tobechecked	\N
47542	t	tobechecked	\N
47546	t	tobechecked	\N
47547	t	tobechecked	\N
47548	t	tobechecked	\N
47549	t	tobechecked	\N
47550	t	tobechecked	\N
47551	t	tobechecked	\N
47552	t	tobechecked	\N
47553	t	tobechecked	\N
47554	t	tobechecked	\N
47555	t	tobechecked	\N
47556	t	tobechecked	\N
47557	t	tobechecked	\N
47558	t	tobechecked	\N
47559	t	tobechecked	\N
47560	t	tobechecked	\N
47561	t	tobechecked	\N
47562	t	tobechecked	\N
47563	t	tobechecked	\N
47583	t	tobechecked	\N
47600	t	tobechecked	\N
47625	t	tobechecked	\N
47656	t	tobechecked	\N
47661	f	tobechecked	\N
47665	t	tobechecked	\N
47666	t	tobechecked	\N
47667	t	tobechecked	\N
47668	t	tobechecked	\N
47669	t	tobechecked	\N
47670	t	tobechecked	\N
47688	t	tobechecked	\N
47696	t	tobechecked	\N
47704	t	tobechecked	\N
47707	t	tobechecked	\N
47720	f	tobechecked	\N
47739	t	tobechecked	\N
47741	t	tobechecked	\N
47773	t	tobechecked	\N
47802	t	tobechecked	\N
47813	t	tobechecked	\N
47821	t	tobechecked	\N
47824	t	tobechecked	\N
47826	t	tobechecked	\N
47827	t	tobechecked	\N
47829	t	tobechecked	\N
47835	t	tobechecked	\N
47836	t	tobechecked	\N
47851	f	tobechecked	\N
47859	f	tobechecked	\N
47904	f	tobechecked	\N
47925	f	tobechecked	\N
47951	f	tobechecked	\N
47960	f	tobechecked	\N
47961	f	tobechecked	\N
47978	f	tobechecked	\N
48018	t	tobechecked	\N
48024	t	tobechecked	\N
48025	f	tobechecked	\N
48026	t	tobechecked	\N
48029	t	tobechecked	\N
48030	t	tobechecked	\N
48031	t	tobechecked	\N
48032	t	tobechecked	\N
48033	t	tobechecked	\N
48034	t	tobechecked	\N
48035	t	tobechecked	\N
48036	t	tobechecked	\N
48037	t	tobechecked	\N
48038	t	tobechecked	\N
48039	t	tobechecked	\N
48040	t	tobechecked	\N
48041	t	tobechecked	\N
48042	t	tobechecked	\N
48043	t	tobechecked	\N
48044	t	tobechecked	\N
48045	t	tobechecked	\N
48046	t	tobechecked	\N
48047	t	tobechecked	\N
48048	t	tobechecked	\N
48049	t	tobechecked	\N
48050	t	tobechecked	\N
48051	t	tobechecked	\N
48052	t	tobechecked	\N
48053	t	tobechecked	\N
48054	t	tobechecked	\N
48055	t	tobechecked	\N
48056	t	tobechecked	\N
48057	t	tobechecked	\N
48058	t	tobechecked	\N
48059	t	tobechecked	\N
48060	t	tobechecked	\N
48061	t	tobechecked	\N
48062	t	tobechecked	\N
48063	t	tobechecked	\N
48068	f	tobechecked	\N
48070	t	tobechecked	\N
48071	t	tobechecked	\N
48072	t	tobechecked	\N
48073	t	tobechecked	\N
48074	t	tobechecked	\N
48075	t	tobechecked	\N
48076	t	tobechecked	\N
48077	t	tobechecked	\N
48078	t	tobechecked	\N
48079	t	tobechecked	\N
48080	t	tobechecked	\N
48081	t	tobechecked	\N
48082	t	tobechecked	\N
48083	t	tobechecked	\N
48084	t	tobechecked	\N
48085	t	tobechecked	\N
48086	t	tobechecked	\N
48087	t	tobechecked	\N
48088	t	tobechecked	\N
48089	t	tobechecked	\N
48090	t	tobechecked	\N
48091	t	tobechecked	\N
48092	t	tobechecked	\N
48093	t	tobechecked	\N
48096	t	tobechecked	\N
48105	f	tobechecked	\N
48107	t	tobechecked	\N
48108	t	tobechecked	\N
48109	t	tobechecked	\N
48110	t	tobechecked	\N
48111	t	tobechecked	\N
48112	t	tobechecked	\N
48113	t	tobechecked	\N
48114	t	tobechecked	\N
48115	t	tobechecked	\N
48116	t	tobechecked	\N
48117	t	tobechecked	\N
48118	t	tobechecked	\N
48119	t	tobechecked	\N
48120	t	tobechecked	\N
48121	t	tobechecked	\N
48122	t	tobechecked	\N
48123	t	tobechecked	\N
48124	t	tobechecked	\N
48125	t	tobechecked	\N
48126	t	tobechecked	\N
48127	t	tobechecked	\N
48128	t	tobechecked	\N
48129	t	tobechecked	\N
48130	t	tobechecked	\N
48131	t	tobechecked	\N
48132	t	tobechecked	\N
48133	t	tobechecked	\N
48134	t	tobechecked	\N
48135	t	tobechecked	\N
48136	t	tobechecked	\N
48152	t	tobechecked	\N
48154	t	tobechecked	\N
48168	t	tobechecked	\N
48169	t	tobechecked	\N
48170	t	tobechecked	\N
48171	t	tobechecked	\N
48172	t	tobechecked	\N
48173	t	tobechecked	\N
48175	t	tobechecked	\N
48176	t	tobechecked	\N
48177	t	tobechecked	\N
48181	t	tobechecked	\N
48223	f	tobechecked	\N
48256	f	tobechecked	\N
48275	f	tobechecked	\N
48277	f	tobechecked	\N
48278	f	tobechecked	\N
48289	f	tobechecked	\N
48299	t	tobechecked	\N
48300	t	tobechecked	\N
48301	t	tobechecked	\N
48302	t	tobechecked	\N
48303	t	tobechecked	\N
48304	t	tobechecked	\N
48305	t	tobechecked	\N
48306	t	tobechecked	\N
48307	t	tobechecked	\N
48308	t	tobechecked	\N
48309	t	tobechecked	\N
48310	t	tobechecked	\N
48311	t	tobechecked	\N
48312	t	tobechecked	\N
48313	t	tobechecked	\N
48314	t	tobechecked	\N
48315	t	tobechecked	\N
48316	t	tobechecked	\N
48317	t	tobechecked	\N
48318	t	tobechecked	\N
48319	t	tobechecked	\N
48320	t	tobechecked	\N
48321	t	tobechecked	\N
48322	t	tobechecked	\N
48323	t	tobechecked	\N
48324	t	tobechecked	\N
48325	t	tobechecked	\N
48326	t	tobechecked	\N
48327	t	tobechecked	\N
48328	t	tobechecked	\N
48329	t	tobechecked	\N
48330	t	tobechecked	\N
48331	t	tobechecked	\N
48332	t	tobechecked	\N
48333	t	tobechecked	\N
48334	t	tobechecked	\N
48335	t	tobechecked	\N
48336	t	tobechecked	\N
48337	t	tobechecked	\N
48338	t	tobechecked	\N
48339	t	tobechecked	\N
48354	t	tobechecked	\N
48355	t	tobechecked	\N
48358	t	tobechecked	\N
48359	t	tobechecked	\N
48360	t	tobechecked	\N
48362	t	tobechecked	\N
48373	t	tobechecked	\N
48384	f	tobechecked	\N
48443	f	tobechecked	\N
48449	f	tobechecked	\N
48470	f	tobechecked	\N
48489	t	tobechecked	\N
48490	f	tobechecked	\N
48513	t	tobechecked	\N
48515	f	tobechecked	\N
48522	t	tobechecked	\N
48527	t	tobechecked	\N
48532	t	tobechecked	\N
48534	t	tobechecked	\N
48537	f	tobechecked	\N
48539	f	tobechecked	\N
48558	t	tobechecked	\N
48593	f	tobechecked	\N
48594	f	tobechecked	\N
48609	f	tobechecked	\N
48612	f	tobechecked	\N
48641	f	tobechecked	\N
48642	f	tobechecked	\N
48651	f	tobechecked	\N
48653	f	tobechecked	\N
48656	f	tobechecked	\N
48666	f	tobechecked	\N
48668	t	tobechecked	\N
48669	t	tobechecked	\N
48670	t	tobechecked	\N
48671	t	tobechecked	\N
48672	t	tobechecked	\N
48673	t	tobechecked	\N
48674	t	tobechecked	\N
48675	t	tobechecked	\N
48676	t	tobechecked	\N
48677	t	tobechecked	\N
48678	t	tobechecked	\N
48679	t	tobechecked	\N
48680	t	tobechecked	\N
48681	t	tobechecked	\N
48682	t	tobechecked	\N
48683	t	tobechecked	\N
48684	t	tobechecked	\N
48685	t	tobechecked	\N
48686	t	tobechecked	\N
48687	t	tobechecked	\N
48688	t	tobechecked	\N
48689	t	tobechecked	\N
48690	t	tobechecked	\N
48691	t	tobechecked	\N
48692	t	tobechecked	\N
48693	t	tobechecked	\N
48694	t	tobechecked	\N
48695	t	tobechecked	\N
48696	t	tobechecked	\N
48697	t	tobechecked	\N
48698	t	tobechecked	\N
48725	f	tobechecked	\N
48726	f	tobechecked	\N
48727	f	tobechecked	\N
48728	f	tobechecked	\N
48729	f	tobechecked	\N
48730	f	tobechecked	\N
48731	f	tobechecked	\N
48732	f	tobechecked	\N
48733	f	tobechecked	\N
48734	f	tobechecked	\N
48735	f	tobechecked	\N
48736	f	tobechecked	\N
48737	f	tobechecked	\N
48738	f	tobechecked	\N
48739	f	tobechecked	\N
48740	f	tobechecked	\N
48741	t	tobechecked	\N
48742	f	tobechecked	\N
48743	f	tobechecked	\N
48744	f	tobechecked	\N
48745	f	tobechecked	\N
48746	f	tobechecked	\N
48747	f	tobechecked	\N
48748	f	tobechecked	\N
48749	f	tobechecked	\N
48750	f	tobechecked	\N
48751	f	tobechecked	\N
48752	t	tobechecked	\N
48754	f	tobechecked	\N
48755	t	tobechecked	\N
48756	f	tobechecked	\N
48757	f	tobechecked	\N
48758	f	tobechecked	\N
48759	f	tobechecked	\N
48760	f	tobechecked	\N
48761	t	tobechecked	\N
48762	t	tobechecked	\N
48763	t	tobechecked	\N
48764	t	tobechecked	\N
48765	t	tobechecked	\N
48766	t	tobechecked	\N
48767	t	tobechecked	\N
48768	t	tobechecked	\N
48769	t	tobechecked	\N
48770	t	tobechecked	\N
48772	t	tobechecked	\N
48773	t	tobechecked	\N
48778	t	tobechecked	\N
48783	f	tobechecked	\N
48791	t	tobechecked	\N
48798	t	tobechecked	\N
48799	t	tobechecked	\N
48812	f	tobechecked	\N
48848	f	tobechecked	\N
48860	f	tobechecked	\N
48879	f	tobechecked	\N
48889	f	tobechecked	\N
48905	f	tobechecked	\N
48910	f	tobechecked	\N
48919	f	tobechecked	\N
48920	t	tobechecked	\N
48921	f	tobechecked	\N
48924	f	tobechecked	\N
48947	f	tobechecked	\N
48948	f	tobechecked	\N
48949	f	tobechecked	\N
48950	f	tobechecked	\N
48951	f	tobechecked	\N
48952	f	tobechecked	\N
48953	f	tobechecked	\N
48954	f	tobechecked	\N
48955	f	tobechecked	\N
48956	f	tobechecked	\N
48957	f	tobechecked	\N
48958	f	tobechecked	\N
48959	f	tobechecked	\N
48960	f	tobechecked	\N
48961	f	tobechecked	\N
48962	f	tobechecked	\N
48963	f	tobechecked	\N
48964	f	tobechecked	\N
48965	f	tobechecked	\N
48966	f	tobechecked	\N
48967	f	tobechecked	\N
48968	f	tobechecked	\N
48971	f	tobechecked	\N
48988	t	tobechecked	\N
48991	t	tobechecked	\N
48999	t	tobechecked	\N
49027	t	tobechecked	\N
49031	f	tobechecked	\N
49032	f	tobechecked	\N
49033	t	tobechecked	\N
49041	t	tobechecked	\N
49042	t	tobechecked	\N
49049	t	tobechecked	\N
49051	t	tobechecked	\N
49058	t	tobechecked	\N
49059	t	tobechecked	\N
49062	t	tobechecked	\N
49063	t	tobechecked	\N
49065	t	tobechecked	\N
49066	t	tobechecked	\N
49067	t	tobechecked	\N
49069	f	tobechecked	\N
49070	t	tobechecked	\N
49089	t	tobechecked	\N
49090	t	tobechecked	\N
49095	t	tobechecked	\N
49096	f	tobechecked	\N
49097	t	tobechecked	\N
49098	t	tobechecked	\N
49099	t	tobechecked	\N
49100	t	tobechecked	\N
49101	t	tobechecked	\N
49102	t	tobechecked	\N
49104	f	tobechecked	\N
49106	t	tobechecked	\N
49107	f	tobechecked	\N
49108	t	tobechecked	\N
49109	t	tobechecked	\N
49110	f	tobechecked	\N
49155	f	tobechecked	\N
49171	f	tobechecked	\N
49197	f	tobechecked	\N
49217	t	tobechecked	\N
49218	t	tobechecked	\N
49219	t	tobechecked	\N
49220	t	tobechecked	\N
49221	t	tobechecked	\N
49239	t	tobechecked	\N
49240	t	tobechecked	\N
49241	t	tobechecked	\N
49242	t	tobechecked	\N
49243	t	tobechecked	\N
49247	t	tobechecked	\N
49248	t	tobechecked	\N
49249	t	tobechecked	\N
49250	t	tobechecked	\N
49254	t	tobechecked	\N
49257	t	tobechecked	\N
49258	t	tobechecked	\N
49259	t	tobechecked	\N
49260	t	tobechecked	\N
49261	t	tobechecked	\N
49262	t	tobechecked	\N
49263	t	tobechecked	\N
49267	t	tobechecked	\N
49268	t	tobechecked	\N
49270	t	tobechecked	\N
49271	t	tobechecked	\N
49272	t	tobechecked	\N
49275	f	tobechecked	\N
49276	f	tobechecked	\N
49277	f	tobechecked	\N
49279	t	tobechecked	\N
49280	t	tobechecked	\N
49281	t	tobechecked	\N
49282	t	tobechecked	\N
49283	t	tobechecked	\N
49289	t	tobechecked	\N
49315	t	tobechecked	\N
49337	t	tobechecked	\N
49338	t	tobechecked	\N
49339	t	tobechecked	\N
49341	t	tobechecked	\N
49342	t	tobechecked	\N
49343	t	tobechecked	\N
49344	t	tobechecked	\N
49346	t	tobechecked	\N
49347	t	tobechecked	\N
49348	t	tobechecked	\N
49349	t	tobechecked	\N
49350	t	tobechecked	\N
49351	t	tobechecked	\N
49355	t	tobechecked	\N
49356	t	tobechecked	\N
49357	t	tobechecked	\N
49359	t	tobechecked	\N
49360	t	tobechecked	\N
49361	t	tobechecked	\N
49365	t	tobechecked	\N
49366	t	tobechecked	\N
49368	t	tobechecked	\N
49369	t	tobechecked	\N
49370	t	tobechecked	\N
49372	t	tobechecked	\N
49373	t	tobechecked	\N
49374	t	tobechecked	\N
49376	t	tobechecked	\N
49377	t	tobechecked	\N
49378	t	tobechecked	\N
49379	t	tobechecked	\N
49381	t	tobechecked	\N
49382	f	tobechecked	\N
49383	t	tobechecked	\N
49384	t	tobechecked	\N
49385	t	tobechecked	\N
49387	t	tobechecked	\N
49388	t	tobechecked	\N
49389	t	tobechecked	\N
49390	t	tobechecked	\N
49391	t	tobechecked	\N
49392	t	tobechecked	\N
49393	t	tobechecked	\N
49395	t	tobechecked	\N
49396	t	tobechecked	\N
49409	t	tobechecked	\N
49413	t	tobechecked	\N
49429	t	tobechecked	\N
49435	t	tobechecked	\N
49438	t	tobechecked	\N
49444	t	tobechecked	\N
49475	f	tobechecked	\N
49480	f	tobechecked	\N
49519	f	tobechecked	\N
49526	t	tobechecked	\N
49527	t	tobechecked	\N
49544	t	tobechecked	\N
49545	t	tobechecked	\N
49546	t	tobechecked	\N
49547	t	tobechecked	\N
49554	f	tobechecked	\N
49555	t	tobechecked	\N
49556	t	tobechecked	\N
49557	t	tobechecked	\N
49561	t	tobechecked	\N
49562	t	tobechecked	\N
49575	t	tobechecked	\N
49577	t	tobechecked	\N
49578	t	tobechecked	\N
49579	t	tobechecked	\N
49580	t	tobechecked	\N
49581	t	tobechecked	\N
49582	t	tobechecked	\N
49588	f	tobechecked	\N
49599	f	tobechecked	\N
49600	f	tobechecked	\N
49601	f	tobechecked	\N
49605	t	tobechecked	\N
49606	t	tobechecked	\N
49614	f	tobechecked	\N
49616	t	tobechecked	\N
49617	t	tobechecked	\N
49625	f	tobechecked	\N
49656	f	tobechecked	\N
49657	f	tobechecked	\N
49666	f	tobechecked	\N
49668	t	tobechecked	\N
49673	f	tobechecked	\N
49675	f	tobechecked	\N
49676	f	tobechecked	\N
49677	f	tobechecked	\N
49685	f	tobechecked	\N
49698	t	tobechecked	\N
49699	t	tobechecked	\N
49700	t	tobechecked	\N
49701	t	tobechecked	\N
49702	t	tobechecked	\N
49703	t	tobechecked	\N
49704	t	tobechecked	\N
49705	t	tobechecked	\N
49707	t	tobechecked	\N
49709	f	tobechecked	\N
49710	t	tobechecked	\N
49711	t	tobechecked	\N
49714	t	tobechecked	\N
49715	t	tobechecked	\N
49719	t	tobechecked	\N
49720	t	tobechecked	\N
49722	t	tobechecked	\N
49724	t	tobechecked	\N
49725	f	tobechecked	\N
49726	t	tobechecked	\N
49727	t	tobechecked	\N
49729	t	tobechecked	\N
49730	t	tobechecked	\N
49731	t	tobechecked	\N
49732	t	tobechecked	\N
49733	t	tobechecked	\N
49734	t	tobechecked	\N
49735	t	tobechecked	\N
49739	t	tobechecked	\N
49740	t	tobechecked	\N
49741	t	tobechecked	\N
49743	t	tobechecked	\N
49744	t	tobechecked	\N
49745	t	tobechecked	\N
49747	f	tobechecked	\N
49748	t	tobechecked	\N
49749	f	tobechecked	\N
49750	t	tobechecked	\N
49766	t	tobechecked	\N
49767	t	tobechecked	\N
49768	t	tobechecked	\N
49769	t	tobechecked	\N
49785	f	tobechecked	\N
49786	f	tobechecked	\N
49787	f	tobechecked	\N
49813	t	tobechecked	\N
49814	t	tobechecked	\N
49825	t	tobechecked	\N
49826	t	tobechecked	\N
49827	t	tobechecked	\N
49828	t	tobechecked	\N
49829	t	tobechecked	\N
49842	t	tobechecked	\N
49848	t	tobechecked	\N
49855	t	tobechecked	\N
49876	t	tobechecked	\N
49980	f	tobechecked	\N
49990	f	tobechecked	\N
49994	f	tobechecked	\N
50003	f	tobechecked	\N
50004	f	tobechecked	\N
50005	f	tobechecked	\N
50012	f	tobechecked	\N
50013	f	tobechecked	\N
50015	f	tobechecked	\N
50030	f	tobechecked	\N
50040	f	tobechecked	\N
50046	f	tobechecked	\N
50052	t	tobechecked	\N
50053	t	tobechecked	\N
50059	t	tobechecked	\N
50128	f	tobechecked	\N
50132	t	tobechecked	\N
50134	t	tobechecked	\N
50139	t	tobechecked	\N
50140	t	tobechecked	\N
50141	t	tobechecked	\N
50142	t	tobechecked	\N
50143	t	tobechecked	\N
50146	t	tobechecked	\N
50151	t	tobechecked	\N
50162	t	tobechecked	\N
50165	t	tobechecked	\N
50169	f	tobechecked	\N
50170	f	tobechecked	\N
50171	f	tobechecked	\N
50172	f	tobechecked	\N
50191	f	tobechecked	\N
50192	f	tobechecked	\N
50200	f	tobechecked	\N
50209	f	tobechecked	\N
50239	f	tobechecked	\N
50243	f	tobechecked	\N
50244	f	tobechecked	\N
50258	t	tobechecked	\N
50259	t	tobechecked	\N
50261	t	tobechecked	\N
50279	t	tobechecked	\N
50282	t	tobechecked	\N
50288	t	tobechecked	\N
50289	t	tobechecked	\N
50304	t	tobechecked	\N
50322	t	tobechecked	\N
50326	t	tobechecked	\N
50348	f	tobechecked	\N
50349	f	tobechecked	\N
50360	f	tobechecked	\N
50380	f	tobechecked	\N
50381	f	tobechecked	\N
50395	f	tobechecked	\N
50408	f	tobechecked	\N
50419	t	tobechecked	\N
50424	f	tobechecked	\N
50426	f	tobechecked	\N
50458	t	tobechecked	\N
50467	t	tobechecked	\N
50468	t	tobechecked	\N
50469	t	tobechecked	\N
50476	t	tobechecked	\N
50482	t	tobechecked	\N
50483	t	tobechecked	\N
50486	t	tobechecked	\N
50489	t	tobechecked	\N
50490	t	tobechecked	\N
50507	t	tobechecked	\N
50519	t	tobechecked	\N
50525	t	tobechecked	\N
50529	t	tobechecked	\N
50535	f	tobechecked	\N
50536	t	tobechecked	\N
50553	t	tobechecked	\N
50557	t	tobechecked	\N
50558	t	tobechecked	\N
50562	t	tobechecked	\N
50563	t	tobechecked	\N
50567	t	tobechecked	\N
50573	t	tobechecked	\N
50576	t	tobechecked	\N
50577	t	tobechecked	\N
50589	t	tobechecked	\N
50599	t	tobechecked	\N
50600	t	tobechecked	\N
50601	t	tobechecked	\N
50603	t	tobechecked	\N
50605	t	tobechecked	\N
50610	t	tobechecked	\N
50622	t	tobechecked	\N
50624	f	tobechecked	\N
50627	t	tobechecked	\N
50639	f	tobechecked	\N
50654	f	tobechecked	\N
50655	f	tobechecked	\N
50656	f	tobechecked	\N
50657	f	tobechecked	\N
50658	t	tobechecked	\N
50659	f	tobechecked	\N
50660	t	tobechecked	\N
50671	t	tobechecked	\N
50701	t	tobechecked	\N
50712	t	tobechecked	\N
50717	t	tobechecked	\N
50718	t	tobechecked	\N
50760	t	tobechecked	\N
50762	t	tobechecked	\N
50763	t	tobechecked	\N
50764	t	tobechecked	\N
50771	t	tobechecked	\N
50772	t	tobechecked	\N
50797	t	tobechecked	\N
50801	t	tobechecked	\N
50807	t	tobechecked	\N
50808	t	tobechecked	\N
50813	t	tobechecked	\N
50814	t	tobechecked	\N
50815	t	tobechecked	\N
50816	t	tobechecked	\N
50817	t	tobechecked	\N
50818	t	tobechecked	\N
50819	t	tobechecked	\N
50820	t	tobechecked	\N
50821	t	tobechecked	\N
50836	f	tobechecked	\N
50837	f	tobechecked	\N
50839	f	tobechecked	\N
50881	f	tobechecked	\N
50885	f	tobechecked	\N
50907	f	tobechecked	\N
50908	f	tobechecked	\N
50909	f	tobechecked	\N
50910	t	tobechecked	\N
50911	t	tobechecked	\N
50912	f	tobechecked	\N
50913	f	tobechecked	\N
50914	f	tobechecked	\N
50915	f	tobechecked	\N
50916	f	tobechecked	\N
50917	f	tobechecked	\N
50918	f	tobechecked	\N
50919	f	tobechecked	\N
50920	f	tobechecked	\N
50937	f	tobechecked	\N
50938	f	tobechecked	\N
50940	t	tobechecked	\N
50952	t	tobechecked	\N
50966	t	tobechecked	\N
50977	t	tobechecked	\N
50984	t	tobechecked	\N
50986	t	tobechecked	\N
50988	t	tobechecked	\N
51001	t	tobechecked	\N
51008	t	tobechecked	\N
51015	f	tobechecked	\N
51016	t	tobechecked	\N
51017	t	tobechecked	\N
51022	f	tobechecked	\N
51035	f	tobechecked	\N
51036	f	tobechecked	\N
51089	f	tobechecked	\N
51106	t	tobechecked	\N
51107	t	tobechecked	\N
51148	f	tobechecked	\N
51160	f	tobechecked	\N
51161	f	tobechecked	\N
51162	f	tobechecked	\N
51181	f	tobechecked	\N
51188	f	tobechecked	\N
51191	f	tobechecked	\N
51212	t	tobechecked	\N
51219	t	tobechecked	\N
51220	t	tobechecked	\N
51221	t	tobechecked	\N
51222	t	tobechecked	\N
51223	t	tobechecked	\N
51224	t	tobechecked	\N
51225	t	tobechecked	\N
51226	t	tobechecked	\N
51227	t	tobechecked	\N
51228	t	tobechecked	\N
51229	t	tobechecked	\N
51232	t	tobechecked	\N
51233	t	tobechecked	\N
51238	t	tobechecked	\N
51242	t	tobechecked	\N
51243	t	tobechecked	\N
51244	t	tobechecked	\N
51256	t	tobechecked	\N
51263	t	tobechecked	\N
51268	t	tobechecked	\N
51297	t	tobechecked	\N
51298	t	tobechecked	\N
51314	t	tobechecked	\N
51332	t	tobechecked	\N
51343	f	tobechecked	\N
51356	f	tobechecked	\N
51385	t	tobechecked	\N
51387	t	tobechecked	\N
51388	t	tobechecked	\N
51395	t	tobechecked	\N
51427	f	tobechecked	\N
51430	f	tobechecked	\N
51435	f	tobechecked	\N
51444	f	tobechecked	\N
51451	f	tobechecked	\N
51472	t	tobechecked	\N
51476	t	tobechecked	\N
51477	t	tobechecked	\N
51479	t	tobechecked	\N
51513	t	tobechecked	\N
51520	f	tobechecked	\N
51521	t	tobechecked	\N
51522	t	tobechecked	\N
51523	t	tobechecked	\N
51555	t	tobechecked	\N
51556	t	tobechecked	\N
51579	f	tobechecked	\N
51580	f	tobechecked	\N
51587	f	tobechecked	\N
51606	f	tobechecked	\N
51607	f	tobechecked	\N
51651	f	tobechecked	\N
51784	t	tobechecked	\N
51785	f	tobechecked	\N
51832	t	tobechecked	\N
51833	f	tobechecked	\N
51834	f	tobechecked	\N
51835	f	tobechecked	\N
51843	t	tobechecked	\N
51850	f	tobechecked	\N
51851	f	tobechecked	\N
51858	t	tobechecked	\N
51882	t	tobechecked	\N
51884	t	tobechecked	\N
51891	t	tobechecked	\N
51894	t	tobechecked	\N
51909	t	tobechecked	\N
51917	t	tobechecked	\N
51999	f	tobechecked	\N
52000	f	tobechecked	\N
52017	f	tobechecked	\N
52021	f	tobechecked	\N
52022	f	tobechecked	\N
52023	f	tobechecked	\N
52025	t	tobechecked	\N
52055	f	tobechecked	\N
52056	t	tobechecked	\N
52057	t	tobechecked	\N
52058	t	tobechecked	\N
52059	t	tobechecked	\N
52060	t	tobechecked	\N
52061	t	tobechecked	\N
52062	t	tobechecked	\N
52065	t	tobechecked	\N
52066	t	tobechecked	\N
52068	t	tobechecked	\N
52069	t	tobechecked	\N
52070	t	tobechecked	\N
52071	t	tobechecked	\N
52072	t	tobechecked	\N
52073	t	tobechecked	\N
52074	t	tobechecked	\N
52075	t	tobechecked	\N
52081	t	tobechecked	\N
52082	t	tobechecked	\N
52090	t	tobechecked	\N
52091	t	tobechecked	\N
52092	t	tobechecked	\N
52093	t	tobechecked	\N
52094	t	tobechecked	\N
52104	t	tobechecked	\N
52109	t	tobechecked	\N
52112	t	tobechecked	\N
52124	t	tobechecked	\N
52130	t	tobechecked	\N
52131	t	tobechecked	\N
52132	t	tobechecked	\N
52138	t	tobechecked	\N
52158	t	tobechecked	\N
52159	t	tobechecked	\N
52183	t	tobechecked	\N
52209	f	tobechecked	\N
52257	f	tobechecked	\N
52258	f	tobechecked	\N
52272	t	tobechecked	\N
52277	t	tobechecked	\N
52288	t	tobechecked	\N
52291	t	tobechecked	\N
52293	t	tobechecked	\N
52294	t	tobechecked	\N
52297	t	tobechecked	\N
52298	t	tobechecked	\N
52299	t	tobechecked	\N
52300	t	tobechecked	\N
52304	t	tobechecked	\N
52308	t	tobechecked	\N
52310	t	tobechecked	\N
52319	t	tobechecked	\N
52356	t	tobechecked	\N
52404	f	tobechecked	\N
52405	f	tobechecked	\N
52413	f	tobechecked	\N
52422	f	tobechecked	\N
52468	t	tobechecked	\N
52469	t	tobechecked	\N
52561	f	tobechecked	\N
52570	f	tobechecked	\N
52585	f	tobechecked	\N
52626	t	tobechecked	\N
52629	t	tobechecked	\N
52633	t	tobechecked	\N
52635	t	tobechecked	\N
52637	t	tobechecked	\N
52642	t	tobechecked	\N
52644	t	tobechecked	\N
52645	t	tobechecked	\N
52655	t	tobechecked	\N
52662	t	tobechecked	\N
52712	f	tobechecked	\N
52721	f	tobechecked	\N
52723	f	tobechecked	\N
52747	f	tobechecked	\N
52771	t	tobechecked	\N
52775	t	tobechecked	\N
52782	t	tobechecked	\N
52817	t	tobechecked	\N
52822	t	tobechecked	\N
52841	t	tobechecked	\N
52890	f	tobechecked	\N
52896	f	tobechecked	\N
52906	f	tobechecked	\N
52928	f	tobechecked	\N
52941	t	tobechecked	\N
52942	t	tobechecked	\N
52943	t	tobechecked	\N
52944	t	tobechecked	\N
52945	t	tobechecked	\N
52946	t	tobechecked	\N
52947	t	tobechecked	\N
52948	t	tobechecked	\N
52949	t	tobechecked	\N
52950	t	tobechecked	\N
52951	t	tobechecked	\N
52952	t	tobechecked	\N
52953	t	tobechecked	\N
52954	t	tobechecked	\N
52955	t	tobechecked	\N
52956	t	tobechecked	\N
52957	t	tobechecked	\N
52966	t	tobechecked	\N
52967	t	tobechecked	\N
52968	t	tobechecked	\N
52969	t	tobechecked	\N
52970	t	tobechecked	\N
52971	t	tobechecked	\N
52974	t	tobechecked	\N
52976	t	tobechecked	\N
52987	t	tobechecked	\N
52988	t	tobechecked	\N
52994	t	tobechecked	\N
52997	t	tobechecked	\N
53001	t	tobechecked	\N
53007	t	tobechecked	\N
53020	t	tobechecked	\N
53054	t	tobechecked	\N
53055	t	tobechecked	\N
53056	t	tobechecked	\N
53057	t	tobechecked	\N
53058	t	tobechecked	\N
53073	f	tobechecked	\N
53092	f	tobechecked	\N
53096	f	tobechecked	\N
53097	f	tobechecked	\N
53099	f	tobechecked	\N
53114	f	tobechecked	\N
53116	f	tobechecked	\N
53117	f	tobechecked	\N
53123	f	tobechecked	\N
53133	f	tobechecked	\N
53171	f	tobechecked	\N
53180	t	tobechecked	\N
53181	t	tobechecked	\N
53217	f	tobechecked	\N
53233	t	tobechecked	\N
53234	t	tobechecked	\N
53235	t	tobechecked	\N
53236	t	tobechecked	\N
53237	t	tobechecked	\N
53250	t	tobechecked	\N
53256	f	tobechecked	\N
53258	t	tobechecked	\N
53259	t	tobechecked	\N
53268	t	tobechecked	\N
53271	t	tobechecked	\N
53273	t	tobechecked	\N
53278	f	tobechecked	\N
53279	t	tobechecked	\N
53283	t	tobechecked	\N
53284	t	tobechecked	\N
53285	f	tobechecked	\N
53289	f	tobechecked	\N
53295	t	tobechecked	\N
53305	t	tobechecked	\N
53318	f	tobechecked	\N
53334	f	tobechecked	\N
53337	f	tobechecked	\N
53338	f	tobechecked	\N
53339	f	tobechecked	\N
53393	f	tobechecked	\N
53447	t	tobechecked	\N
53448	t	tobechecked	\N
53456	t	tobechecked	\N
53457	t	tobechecked	\N
53458	t	tobechecked	\N
53496	t	tobechecked	\N
53517	t	tobechecked	\N
53555	t	tobechecked	\N
53556	t	tobechecked	\N
53557	t	tobechecked	\N
53559	t	tobechecked	\N
53565	t	tobechecked	\N
53568	t	tobechecked	\N
53570	t	tobechecked	\N
53572	t	tobechecked	\N
53574	t	tobechecked	\N
53575	t	tobechecked	\N
53576	t	tobechecked	\N
53580	t	tobechecked	\N
53581	t	tobechecked	\N
53585	t	tobechecked	\N
53599	t	tobechecked	\N
53601	t	tobechecked	\N
53604	t	tobechecked	\N
53605	t	tobechecked	\N
53606	t	tobechecked	\N
53611	t	tobechecked	\N
53612	t	tobechecked	\N
53613	t	tobechecked	\N
53616	t	tobechecked	\N
53617	t	tobechecked	\N
53618	t	tobechecked	\N
53619	t	tobechecked	\N
53620	t	tobechecked	\N
53621	t	tobechecked	\N
53622	t	tobechecked	\N
53623	t	tobechecked	\N
53624	t	tobechecked	\N
53625	t	tobechecked	\N
53626	t	tobechecked	\N
53627	t	tobechecked	\N
53628	t	tobechecked	\N
53629	t	tobechecked	\N
53630	t	tobechecked	\N
53651	f	tobechecked	\N
53653	t	tobechecked	\N
53657	t	tobechecked	\N
53669	t	tobechecked	\N
53670	t	tobechecked	\N
53677	f	tobechecked	\N
53695	f	tobechecked	\N
53696	f	tobechecked	\N
53697	f	tobechecked	\N
53718	f	tobechecked	\N
53730	f	tobechecked	\N
53733	f	tobechecked	\N
53740	f	tobechecked	\N
53767	f	tobechecked	\N
53773	f	tobechecked	\N
53777	f	tobechecked	\N
53781	t	tobechecked	\N
53782	t	tobechecked	\N
53787	t	tobechecked	\N
53791	t	tobechecked	\N
53793	t	tobechecked	\N
53797	t	tobechecked	\N
53812	f	tobechecked	\N
53815	f	tobechecked	\N
53835	f	tobechecked	\N
53865	f	tobechecked	\N
53884	f	tobechecked	\N
53893	f	tobechecked	\N
53911	f	tobechecked	\N
53919	f	tobechecked	\N
53920	f	tobechecked	\N
53942	f	tobechecked	\N
53960	f	tobechecked	\N
53961	f	tobechecked	\N
53963	f	tobechecked	\N
53982	f	tobechecked	\N
53990	f	tobechecked	\N
53995	f	tobechecked	\N
54011	f	tobechecked	\N
54021	f	tobechecked	\N
54025	f	tobechecked	\N
54038	f	tobechecked	\N
54044	f	tobechecked	\N
54080	f	tobechecked	\N
54085	f	tobechecked	\N
54092	t	tobechecked	\N
54109	t	tobechecked	\N
54122	t	tobechecked	\N
54123	t	tobechecked	\N
54127	t	tobechecked	\N
54136	f	tobechecked	\N
54141	f	tobechecked	\N
54144	t	tobechecked	\N
54159	t	tobechecked	\N
54160	t	tobechecked	\N
54163	t	tobechecked	\N
54168	t	tobechecked	\N
54169	t	tobechecked	\N
54189	t	tobechecked	\N
54202	t	tobechecked	\N
54203	t	tobechecked	\N
54230	t	tobechecked	\N
54231	f	tobechecked	\N
54233	t	tobechecked	\N
54234	t	tobechecked	\N
54236	t	tobechecked	\N
54237	t	tobechecked	\N
54254	t	tobechecked	\N
54255	t	tobechecked	\N
54270	f	tobechecked	\N
54277	f	tobechecked	\N
54315	f	tobechecked	\N
54325	f	tobechecked	\N
54326	f	tobechecked	\N
54327	f	tobechecked	\N
54328	f	tobechecked	\N
54333	f	tobechecked	\N
54397	t	tobechecked	\N
54424	t	tobechecked	\N
54429	t	tobechecked	\N
54431	t	tobechecked	\N
54449	f	tobechecked	\N
54454	f	tobechecked	\N
54456	t	tobechecked	\N
54463	f	tobechecked	\N
54475	f	tobechecked	\N
54476	f	tobechecked	\N
54481	f	tobechecked	\N
54502	f	tobechecked	\N
54517	f	tobechecked	\N
54525	f	tobechecked	\N
54567	t	tobechecked	\N
54580	t	tobechecked	\N
54583	f	tobechecked	\N
54584	t	tobechecked	\N
54596	t	tobechecked	\N
54602	f	tobechecked	\N
54603	f	tobechecked	\N
54604	f	tobechecked	\N
54605	f	tobechecked	\N
54612	t	tobechecked	\N
54627	t	tobechecked	\N
54648	t	tobechecked	\N
54651	t	tobechecked	\N
54663	t	tobechecked	\N
54664	t	tobechecked	\N
54666	t	tobechecked	\N
54667	t	tobechecked	\N
54668	t	tobechecked	\N
54669	t	tobechecked	\N
54670	t	tobechecked	\N
54671	t	tobechecked	\N
54672	t	tobechecked	\N
54673	t	tobechecked	\N
54674	t	tobechecked	\N
54675	t	tobechecked	\N
54676	t	tobechecked	\N
54677	t	tobechecked	\N
54678	t	tobechecked	\N
54679	t	tobechecked	\N
54680	t	tobechecked	\N
54681	t	tobechecked	\N
54682	t	tobechecked	\N
54683	f	tobechecked	\N
54684	f	tobechecked	\N
54685	f	tobechecked	\N
54686	t	tobechecked	\N
54687	t	tobechecked	\N
54688	t	tobechecked	\N
54689	t	tobechecked	\N
54690	t	tobechecked	\N
54691	t	tobechecked	\N
54692	t	tobechecked	\N
54693	t	tobechecked	\N
54694	t	tobechecked	\N
54695	f	tobechecked	\N
54696	t	tobechecked	\N
54697	t	tobechecked	\N
54698	t	tobechecked	\N
54699	t	tobechecked	\N
54700	t	tobechecked	\N
54701	f	tobechecked	\N
54704	t	tobechecked	\N
54705	f	tobechecked	\N
54715	t	tobechecked	\N
54718	t	tobechecked	\N
54721	f	tobechecked	\N
54722	f	tobechecked	\N
54723	f	tobechecked	\N
54724	f	tobechecked	\N
54725	f	tobechecked	\N
54726	f	tobechecked	\N
54727	f	tobechecked	\N
54728	f	tobechecked	\N
54729	f	tobechecked	\N
54730	f	tobechecked	\N
54731	t	tobechecked	\N
54732	f	tobechecked	\N
54733	f	tobechecked	\N
54734	f	tobechecked	\N
54735	f	tobechecked	\N
54736	t	tobechecked	\N
54739	t	tobechecked	\N
54740	t	tobechecked	\N
54741	f	tobechecked	\N
54762	f	tobechecked	\N
54763	f	tobechecked	\N
54764	f	tobechecked	\N
54765	f	tobechecked	\N
54790	f	tobechecked	\N
54799	f	tobechecked	\N
54800	f	tobechecked	\N
54801	f	tobechecked	\N
54802	f	tobechecked	\N
54803	f	tobechecked	\N
54814	f	tobechecked	\N
54815	f	tobechecked	\N
54816	f	tobechecked	\N
54817	f	tobechecked	\N
54818	f	tobechecked	\N
54819	f	tobechecked	\N
54820	f	tobechecked	\N
54821	f	tobechecked	\N
54822	f	tobechecked	\N
54828	f	tobechecked	\N
54904	f	tobechecked	\N
54905	f	tobechecked	\N
54909	f	tobechecked	\N
54950	f	tobechecked	\N
54963	f	tobechecked	\N
54995	f	tobechecked	\N
54996	f	tobechecked	\N
54997	f	tobechecked	\N
54998	f	tobechecked	\N
54999	f	tobechecked	\N
55000	f	tobechecked	\N
55001	f	tobechecked	\N
55008	f	tobechecked	\N
55032	f	tobechecked	\N
55043	f	tobechecked	\N
55044	f	tobechecked	\N
55046	f	tobechecked	\N
55056	f	tobechecked	\N
55057	f	tobechecked	\N
55058	f	tobechecked	\N
55059	f	tobechecked	\N
55060	f	tobechecked	\N
55061	f	tobechecked	\N
55062	f	tobechecked	\N
55063	f	tobechecked	\N
55064	f	tobechecked	\N
55065	f	tobechecked	\N
55066	f	tobechecked	\N
55077	t	tobechecked	\N
55078	f	tobechecked	\N
55103	t	tobechecked	\N
55117	f	tobechecked	\N
55118	f	tobechecked	\N
55120	f	tobechecked	\N
55121	f	tobechecked	\N
55127	f	tobechecked	\N
55134	f	tobechecked	\N
55162	f	tobechecked	\N
55169	t	tobechecked	\N
55170	t	tobechecked	\N
55171	t	tobechecked	\N
55175	t	tobechecked	\N
55183	t	tobechecked	\N
55184	t	tobechecked	\N
55187	f	tobechecked	\N
55188	f	tobechecked	\N
55189	f	tobechecked	\N
55190	f	tobechecked	\N
55192	t	tobechecked	\N
55193	t	tobechecked	\N
55194	t	tobechecked	\N
55214	f	tobechecked	\N
55226	f	tobechecked	\N
55233	f	tobechecked	\N
55242	f	tobechecked	\N
55243	f	tobechecked	\N
55244	f	tobechecked	\N
55248	f	tobechecked	\N
55254	f	tobechecked	\N
55277	f	tobechecked	\N
55283	f	tobechecked	\N
55284	f	tobechecked	\N
55290	f	tobechecked	\N
55291	f	tobechecked	\N
55298	f	tobechecked	\N
55300	f	tobechecked	\N
55309	f	tobechecked	\N
55351	f	tobechecked	\N
55357	f	tobechecked	\N
55368	f	tobechecked	\N
55373	f	tobechecked	\N
55379	f	tobechecked	\N
55390	f	tobechecked	\N
55393	f	tobechecked	\N
55395	f	tobechecked	\N
55400	f	tobechecked	\N
55407	f	tobechecked	\N
55415	f	tobechecked	\N
55428	f	tobechecked	\N
55488	f	tobechecked	\N
55489	f	tobechecked	\N
55496	f	tobechecked	\N
55497	f	tobechecked	\N
55499	f	tobechecked	\N
55501	f	tobechecked	\N
55502	f	tobechecked	\N
55505	f	tobechecked	\N
55507	f	tobechecked	\N
55542	t	tobechecked	\N
55544	t	tobechecked	\N
55545	t	tobechecked	\N
55546	t	tobechecked	\N
55547	t	tobechecked	\N
55548	t	tobechecked	\N
55549	t	tobechecked	\N
55552	t	tobechecked	\N
55553	t	tobechecked	\N
55554	t	tobechecked	\N
55555	t	tobechecked	\N
55556	t	tobechecked	\N
55561	t	tobechecked	\N
55566	t	tobechecked	\N
55570	t	tobechecked	\N
55571	t	tobechecked	\N
55575	t	tobechecked	\N
55577	t	tobechecked	\N
55581	t	tobechecked	\N
55582	t	tobechecked	\N
55589	f	tobechecked	\N
55657	f	tobechecked	\N
55658	f	tobechecked	\N
55659	f	tobechecked	\N
55660	f	tobechecked	\N
55661	f	tobechecked	\N
55662	f	tobechecked	\N
55663	f	tobechecked	\N
55664	f	tobechecked	\N
55665	f	tobechecked	\N
55666	f	tobechecked	\N
55667	f	tobechecked	\N
55668	f	tobechecked	\N
55669	f	tobechecked	\N
55670	f	tobechecked	\N
55671	f	tobechecked	\N
55672	f	tobechecked	\N
55673	f	tobechecked	\N
55674	f	tobechecked	\N
55675	f	tobechecked	\N
55676	f	tobechecked	\N
55677	f	tobechecked	\N
55678	f	tobechecked	\N
55679	f	tobechecked	\N
55680	f	tobechecked	\N
55681	f	tobechecked	\N
55682	f	tobechecked	\N
55683	f	tobechecked	\N
55684	f	tobechecked	\N
55685	f	tobechecked	\N
55686	f	tobechecked	\N
55687	f	tobechecked	\N
55688	f	tobechecked	\N
55689	f	tobechecked	\N
55690	f	tobechecked	\N
55691	f	tobechecked	\N
55692	f	tobechecked	\N
55693	f	tobechecked	\N
55694	f	tobechecked	\N
55695	f	tobechecked	\N
55696	f	tobechecked	\N
55697	f	tobechecked	\N
55698	f	tobechecked	\N
55699	f	tobechecked	\N
55700	f	tobechecked	\N
55701	f	tobechecked	\N
55702	f	tobechecked	\N
55703	f	tobechecked	\N
55704	f	tobechecked	\N
55705	f	tobechecked	\N
55706	f	tobechecked	\N
55707	f	tobechecked	\N
55708	f	tobechecked	\N
55737	t	tobechecked	\N
55738	t	tobechecked	\N
55753	f	tobechecked	\N
55756	t	tobechecked	\N
55762	t	tobechecked	\N
55764	t	tobechecked	\N
55767	f	tobechecked	\N
55768	f	tobechecked	\N
55773	t	tobechecked	\N
55817	t	tobechecked	\N
55827	t	tobechecked	\N
55847	f	tobechecked	\N
55877	f	tobechecked	\N
55927	f	tobechecked	\N
55928	f	tobechecked	\N
55929	f	tobechecked	\N
55930	f	tobechecked	\N
55931	f	tobechecked	\N
55932	f	tobechecked	\N
55933	f	tobechecked	\N
55934	f	tobechecked	\N
55935	f	tobechecked	\N
55936	f	tobechecked	\N
55937	f	tobechecked	\N
55938	f	tobechecked	\N
55939	f	tobechecked	\N
55940	f	tobechecked	\N
55941	f	tobechecked	\N
55942	f	tobechecked	\N
55943	f	tobechecked	\N
55944	f	tobechecked	\N
55945	f	tobechecked	\N
55947	f	tobechecked	\N
55948	f	tobechecked	\N
55949	f	tobechecked	\N
55951	f	tobechecked	\N
55952	f	tobechecked	\N
55958	f	tobechecked	\N
55961	f	tobechecked	\N
55975	t	tobechecked	\N
55977	t	tobechecked	\N
55979	f	tobechecked	\N
55985	t	tobechecked	\N
55987	f	tobechecked	\N
55988	t	tobechecked	\N
56012	f	tobechecked	\N
56019	f	tobechecked	\N
56025	f	tobechecked	\N
56031	f	tobechecked	\N
56041	f	tobechecked	\N
56047	f	tobechecked	\N
56051	f	tobechecked	\N
56083	t	tobechecked	\N
56089	t	tobechecked	\N
56093	t	tobechecked	\N
56097	f	tobechecked	\N
56100	t	tobechecked	\N
56104	t	tobechecked	\N
56110	f	tobechecked	\N
56111	t	tobechecked	\N
56113	t	tobechecked	\N
56114	t	tobechecked	\N
56115	t	tobechecked	\N
56119	t	tobechecked	\N
56129	f	tobechecked	\N
56147	t	tobechecked	\N
56149	t	tobechecked	\N
56154	t	tobechecked	\N
56156	t	tobechecked	\N
56157	t	tobechecked	\N
56158	t	tobechecked	\N
56159	t	tobechecked	\N
56160	t	tobechecked	\N
56161	t	tobechecked	\N
56162	t	tobechecked	\N
56163	t	tobechecked	\N
56164	t	tobechecked	\N
56165	t	tobechecked	\N
56177	f	tobechecked	\N
56178	f	tobechecked	\N
56179	f	tobechecked	\N
56180	f	tobechecked	\N
56181	f	tobechecked	\N
56182	f	tobechecked	\N
56183	f	tobechecked	\N
56184	f	tobechecked	\N
56185	f	tobechecked	\N
56186	f	tobechecked	\N
56187	f	tobechecked	\N
56188	f	tobechecked	\N
56189	f	tobechecked	\N
56190	f	tobechecked	\N
56191	f	tobechecked	\N
56192	f	tobechecked	\N
56193	f	tobechecked	\N
56194	f	tobechecked	\N
56197	f	tobechecked	\N
56198	f	tobechecked	\N
56239	f	tobechecked	\N
56260	t	tobechecked	\N
56279	t	tobechecked	\N
56320	f	tobechecked	\N
56321	f	tobechecked	\N
56322	f	tobechecked	\N
56323	f	tobechecked	\N
56324	f	tobechecked	\N
56325	f	tobechecked	\N
56344	f	tobechecked	\N
56347	f	tobechecked	\N
56348	f	tobechecked	\N
56369	f	tobechecked	\N
56389	t	tobechecked	\N
56402	t	tobechecked	\N
56468	t	tobechecked	\N
56469	t	tobechecked	\N
56470	t	tobechecked	\N
56480	t	tobechecked	\N
56481	t	tobechecked	\N
56489	t	tobechecked	\N
56490	f	tobechecked	\N
56501	t	tobechecked	\N
56503	t	tobechecked	\N
56504	f	tobechecked	\N
56508	t	tobechecked	\N
56509	t	tobechecked	\N
56510	t	tobechecked	\N
56520	t	tobechecked	\N
56522	t	tobechecked	\N
56528	t	tobechecked	\N
56536	t	tobechecked	\N
56537	t	tobechecked	\N
56541	t	tobechecked	\N
56546	t	tobechecked	\N
56553	t	tobechecked	\N
56557	f	tobechecked	\N
56572	f	tobechecked	\N
56593	f	tobechecked	\N
56637	f	tobechecked	\N
56638	t	tobechecked	\N
56639	t	tobechecked	\N
56640	t	tobechecked	\N
56650	t	tobechecked	\N
56651	t	tobechecked	\N
56681	t	tobechecked	\N
56709	t	tobechecked	\N
56723	t	tobechecked	\N
56724	t	tobechecked	\N
56734	t	tobechecked	\N
56749	t	tobechecked	\N
56750	f	tobechecked	\N
56751	t	tobechecked	\N
56752	t	tobechecked	\N
56753	t	tobechecked	\N
56758	t	tobechecked	\N
56766	f	tobechecked	\N
56767	f	tobechecked	\N
56814	f	tobechecked	\N
56815	f	tobechecked	\N
56816	f	tobechecked	\N
56824	f	tobechecked	\N
56840	f	tobechecked	\N
56849	f	tobechecked	\N
56850	f	tobechecked	\N
56851	f	tobechecked	\N
56852	f	tobechecked	\N
56853	f	tobechecked	\N
56854	f	tobechecked	\N
56855	f	tobechecked	\N
56856	f	tobechecked	\N
56857	f	tobechecked	\N
56858	f	tobechecked	\N
56859	f	tobechecked	\N
56860	f	tobechecked	\N
56861	f	tobechecked	\N
56862	f	tobechecked	\N
56863	f	tobechecked	\N
56864	f	tobechecked	\N
56865	f	tobechecked	\N
56866	f	tobechecked	\N
56867	f	tobechecked	\N
56868	f	tobechecked	\N
56869	f	tobechecked	\N
56870	f	tobechecked	\N
56871	f	tobechecked	\N
56872	f	tobechecked	\N
56873	f	tobechecked	\N
56874	f	tobechecked	\N
56875	f	tobechecked	\N
56876	f	tobechecked	\N
56877	f	tobechecked	\N
56878	f	tobechecked	\N
56879	f	tobechecked	\N
56880	f	tobechecked	\N
56881	f	tobechecked	\N
56882	f	tobechecked	\N
56883	f	tobechecked	\N
56889	f	tobechecked	\N
56890	f	tobechecked	\N
56891	f	tobechecked	\N
56892	f	tobechecked	\N
56893	f	tobechecked	\N
56894	f	tobechecked	\N
56895	f	tobechecked	\N
56896	f	tobechecked	\N
56897	f	tobechecked	\N
56899	f	tobechecked	\N
56900	f	tobechecked	\N
56902	f	tobechecked	\N
56903	f	tobechecked	\N
56904	f	tobechecked	\N
56905	f	tobechecked	\N
56906	f	tobechecked	\N
56943	f	tobechecked	\N
56960	f	tobechecked	\N
56964	f	tobechecked	\N
56966	f	tobechecked	\N
56967	f	tobechecked	\N
56998	t	tobechecked	\N
57013	f	tobechecked	\N
57021	f	tobechecked	\N
57029	f	tobechecked	\N
57050	f	tobechecked	\N
57053	f	tobechecked	\N
57057	f	tobechecked	\N
57072	f	tobechecked	\N
57073	f	tobechecked	\N
57103	f	tobechecked	\N
57107	f	tobechecked	\N
57124	f	tobechecked	\N
57130	f	tobechecked	\N
57172	f	tobechecked	\N
57173	f	tobechecked	\N
57174	f	tobechecked	\N
57175	f	tobechecked	\N
57176	f	tobechecked	\N
57181	f	tobechecked	\N
57182	f	tobechecked	\N
57255	f	tobechecked	\N
57314	f	tobechecked	\N
57320	f	tobechecked	\N
57321	f	tobechecked	\N
57329	f	tobechecked	\N
57340	f	tobechecked	\N
57384	f	tobechecked	\N
57394	t	tobechecked	\N
57406	t	tobechecked	\N
57408	f	tobechecked	\N
57409	t	tobechecked	\N
57411	t	tobechecked	\N
57413	t	tobechecked	\N
57414	t	tobechecked	\N
57415	f	tobechecked	\N
57418	t	tobechecked	\N
57423	t	tobechecked	\N
57424	t	tobechecked	\N
57425	t	tobechecked	\N
57436	t	tobechecked	\N
57451	t	tobechecked	\N
57455	t	tobechecked	\N
57469	t	tobechecked	\N
57470	t	tobechecked	\N
57471	t	tobechecked	\N
57472	t	tobechecked	\N
57473	f	tobechecked	\N
57476	f	tobechecked	\N
57478	t	tobechecked	\N
57480	f	tobechecked	\N
57481	f	tobechecked	\N
57482	f	tobechecked	\N
57483	t	tobechecked	\N
57487	f	tobechecked	\N
57488	f	tobechecked	\N
57489	f	tobechecked	\N
57508	f	tobechecked	\N
57510	f	tobechecked	\N
57531	f	tobechecked	\N
57534	f	tobechecked	\N
57535	f	tobechecked	\N
57602	f	tobechecked	\N
57604	f	tobechecked	\N
57605	f	tobechecked	\N
57606	f	tobechecked	\N
57607	f	tobechecked	\N
57608	f	tobechecked	\N
57609	f	tobechecked	\N
57610	f	tobechecked	\N
57611	f	tobechecked	\N
57612	t	tobechecked	\N
57613	t	tobechecked	\N
57614	t	tobechecked	\N
57615	t	tobechecked	\N
57616	f	tobechecked	\N
57617	t	tobechecked	\N
57618	t	tobechecked	\N
57619	t	tobechecked	\N
57620	t	tobechecked	\N
57621	t	tobechecked	\N
57622	t	tobechecked	\N
57623	t	tobechecked	\N
57624	t	tobechecked	\N
57625	t	tobechecked	\N
57626	t	tobechecked	\N
57627	t	tobechecked	\N
57628	t	tobechecked	\N
57629	f	tobechecked	\N
57631	f	tobechecked	\N
57632	t	tobechecked	\N
57633	t	tobechecked	\N
57634	t	tobechecked	\N
57635	t	tobechecked	\N
57636	t	tobechecked	\N
57637	t	tobechecked	\N
57639	f	tobechecked	\N
57649	t	tobechecked	\N
57655	t	tobechecked	\N
57658	f	tobechecked	\N
57661	f	tobechecked	\N
57665	t	tobechecked	\N
57690	f	tobechecked	\N
57691	f	tobechecked	\N
57692	f	tobechecked	\N
57693	f	tobechecked	\N
57694	f	tobechecked	\N
57695	f	tobechecked	\N
57698	t	tobechecked	\N
57699	t	tobechecked	\N
57700	t	tobechecked	\N
57701	t	tobechecked	\N
57702	t	tobechecked	\N
57703	t	tobechecked	\N
57715	f	tobechecked	\N
57716	f	tobechecked	\N
57734	f	tobechecked	\N
57735	f	tobechecked	\N
57736	f	tobechecked	\N
57737	f	tobechecked	\N
57738	f	tobechecked	\N
57739	f	tobechecked	\N
57740	f	tobechecked	\N
57741	f	tobechecked	\N
57743	f	tobechecked	\N
57775	f	tobechecked	\N
57779	f	tobechecked	\N
57789	f	tobechecked	\N
57805	f	tobechecked	\N
57807	f	tobechecked	\N
57823	t	tobechecked	\N
57846	f	tobechecked	\N
57850	f	tobechecked	\N
57851	f	tobechecked	\N
57880	f	tobechecked	\N
57882	f	tobechecked	\N
57900	f	tobechecked	\N
57904	t	tobechecked	\N
57905	t	tobechecked	\N
57906	t	tobechecked	\N
57907	t	tobechecked	\N
57908	t	tobechecked	\N
57909	t	tobechecked	\N
57913	t	tobechecked	\N
57914	t	tobechecked	\N
57915	t	tobechecked	\N
57916	t	tobechecked	\N
57917	t	tobechecked	\N
57919	t	tobechecked	\N
57920	t	tobechecked	\N
57921	t	tobechecked	\N
57933	t	tobechecked	\N
57941	t	tobechecked	\N
57942	t	tobechecked	\N
57943	t	tobechecked	\N
57944	t	tobechecked	\N
57945	t	tobechecked	\N
57946	t	tobechecked	\N
57947	t	tobechecked	\N
57952	t	tobechecked	\N
57954	t	tobechecked	\N
57960	t	tobechecked	\N
57965	t	tobechecked	\N
57971	t	tobechecked	\N
57974	t	tobechecked	\N
57979	t	tobechecked	\N
57980	t	tobechecked	\N
57981	f	tobechecked	\N
57982	t	tobechecked	\N
57983	t	tobechecked	\N
57984	t	tobechecked	\N
57985	t	tobechecked	\N
57986	t	tobechecked	\N
57987	t	tobechecked	\N
57989	t	tobechecked	\N
57990	t	tobechecked	\N
57991	t	tobechecked	\N
57992	t	tobechecked	\N
58031	t	tobechecked	\N
58032	t	tobechecked	\N
58038	t	tobechecked	\N
58039	t	tobechecked	\N
58040	t	tobechecked	\N
58041	t	tobechecked	\N
58042	t	tobechecked	\N
58043	t	tobechecked	\N
58044	t	tobechecked	\N
58045	t	tobechecked	\N
58067	t	tobechecked	\N
58068	t	tobechecked	\N
58069	t	tobechecked	\N
58087	t	tobechecked	\N
58116	f	tobechecked	\N
58117	t	tobechecked	\N
58142	t	tobechecked	\N
58143	t	tobechecked	\N
58160	t	tobechecked	\N
58161	t	tobechecked	\N
58162	t	tobechecked	\N
58163	t	tobechecked	\N
58164	t	tobechecked	\N
58165	t	tobechecked	\N
58166	t	tobechecked	\N
58167	t	tobechecked	\N
58168	f	tobechecked	\N
58169	t	tobechecked	\N
58170	f	tobechecked	\N
58191	f	tobechecked	\N
58192	f	tobechecked	\N
58219	f	tobechecked	\N
58220	f	tobechecked	\N
58240	f	tobechecked	\N
58241	f	tobechecked	\N
58242	f	tobechecked	\N
58243	f	tobechecked	\N
58244	f	tobechecked	\N
58245	f	tobechecked	\N
58246	f	tobechecked	\N
58247	f	tobechecked	\N
58248	f	tobechecked	\N
58249	f	tobechecked	\N
58250	f	tobechecked	\N
58251	f	tobechecked	\N
58252	f	tobechecked	\N
58253	f	tobechecked	\N
58254	f	tobechecked	\N
58255	f	tobechecked	\N
58256	f	tobechecked	\N
58257	f	tobechecked	\N
58258	f	tobechecked	\N
58259	f	tobechecked	\N
58260	f	tobechecked	\N
58262	t	tobechecked	\N
58265	t	tobechecked	\N
58266	t	tobechecked	\N
58284	t	tobechecked	\N
58293	t	tobechecked	\N
58297	t	tobechecked	\N
58299	t	tobechecked	\N
58310	t	tobechecked	\N
58311	t	tobechecked	\N
58322	t	tobechecked	\N
58324	t	tobechecked	\N
58325	f	tobechecked	\N
58340	f	tobechecked	\N
58341	f	tobechecked	\N
58342	f	tobechecked	\N
58343	f	tobechecked	\N
58344	f	tobechecked	\N
58345	f	tobechecked	\N
58346	f	tobechecked	\N
58362	f	tobechecked	\N
58374	f	tobechecked	\N
58395	t	tobechecked	\N
58396	t	tobechecked	\N
58406	t	tobechecked	\N
58409	t	tobechecked	\N
58412	t	tobechecked	\N
58413	t	tobechecked	\N
58421	t	tobechecked	\N
58425	t	tobechecked	\N
58426	t	tobechecked	\N
58431	t	tobechecked	\N
58437	t	tobechecked	\N
58439	f	tobechecked	\N
58441	t	tobechecked	\N
58447	f	tobechecked	\N
58450	t	tobechecked	\N
58451	t	tobechecked	\N
58452	t	tobechecked	\N
58453	t	tobechecked	\N
58454	t	tobechecked	\N
58455	t	tobechecked	\N
58456	t	tobechecked	\N
58457	t	tobechecked	\N
58458	t	tobechecked	\N
58459	t	tobechecked	\N
58460	t	tobechecked	\N
58461	t	tobechecked	\N
58468	t	tobechecked	\N
58473	t	tobechecked	\N
58477	t	tobechecked	\N
58478	t	tobechecked	\N
58479	t	tobechecked	\N
58480	t	tobechecked	\N
58481	t	tobechecked	\N
58482	t	tobechecked	\N
58483	f	tobechecked	\N
58484	f	tobechecked	\N
58485	f	tobechecked	\N
58486	f	tobechecked	\N
58487	f	tobechecked	\N
58488	f	tobechecked	\N
58489	f	tobechecked	\N
58490	f	tobechecked	\N
58491	f	tobechecked	\N
58492	f	tobechecked	\N
58493	f	tobechecked	\N
58494	f	tobechecked	\N
58495	f	tobechecked	\N
58502	f	tobechecked	\N
58503	f	tobechecked	\N
58504	f	tobechecked	\N
58516	f	tobechecked	\N
58518	f	tobechecked	\N
58519	f	tobechecked	\N
58533	f	tobechecked	\N
58567	f	tobechecked	\N
58574	t	tobechecked	\N
58580	t	tobechecked	\N
58583	t	tobechecked	\N
58584	t	tobechecked	\N
58585	t	tobechecked	\N
58586	t	tobechecked	\N
58591	t	tobechecked	\N
58592	f	tobechecked	\N
58593	t	tobechecked	\N
58595	t	tobechecked	\N
58600	t	tobechecked	\N
58607	t	tobechecked	\N
58613	t	tobechecked	\N
58614	f	tobechecked	\N
58616	t	tobechecked	\N
58622	f	tobechecked	\N
58626	t	tobechecked	\N
58627	t	tobechecked	\N
58628	t	tobechecked	\N
58631	t	tobechecked	\N
58640	t	tobechecked	\N
58641	t	tobechecked	\N
58646	f	tobechecked	\N
58674	t	tobechecked	\N
58678	f	tobechecked	\N
58679	f	tobechecked	\N
58680	t	tobechecked	\N
58682	t	tobechecked	\N
58684	t	tobechecked	\N
58686	t	tobechecked	\N
58688	t	tobechecked	\N
58696	t	tobechecked	\N
58697	t	tobechecked	\N
58706	f	tobechecked	\N
58725	f	tobechecked	\N
58744	f	tobechecked	\N
58747	t	tobechecked	\N
58748	t	tobechecked	\N
58749	t	tobechecked	\N
58751	f	tobechecked	\N
58757	t	tobechecked	\N
58772	f	tobechecked	\N
58783	t	tobechecked	\N
58787	t	tobechecked	\N
58799	f	tobechecked	\N
58800	f	tobechecked	\N
58802	t	tobechecked	\N
58808	t	tobechecked	\N
58809	t	tobechecked	\N
58831	f	tobechecked	\N
58834	f	tobechecked	\N
58844	f	tobechecked	\N
58845	f	tobechecked	\N
58846	f	tobechecked	\N
58847	f	tobechecked	\N
58848	f	tobechecked	\N
58853	f	tobechecked	\N
58854	f	tobechecked	\N
58866	f	tobechecked	\N
58877	t	tobechecked	\N
58886	t	tobechecked	\N
58893	t	tobechecked	\N
58894	t	tobechecked	\N
58897	t	tobechecked	\N
58903	t	tobechecked	\N
58904	t	tobechecked	\N
58910	t	tobechecked	\N
58911	t	tobechecked	\N
58912	t	tobechecked	\N
58913	t	tobechecked	\N
58914	t	tobechecked	\N
58915	t	tobechecked	\N
58916	t	tobechecked	\N
58917	t	tobechecked	\N
58921	t	tobechecked	\N
58922	t	tobechecked	\N
58923	f	tobechecked	\N
58925	t	tobechecked	\N
58928	t	tobechecked	\N
58930	t	tobechecked	\N
58931	t	tobechecked	\N
58933	t	tobechecked	\N
58934	t	tobechecked	\N
58935	t	tobechecked	\N
58938	t	tobechecked	\N
58941	t	tobechecked	\N
58942	t	tobechecked	\N
58943	t	tobechecked	\N
58948	t	tobechecked	\N
58950	t	tobechecked	\N
58951	t	tobechecked	\N
58952	f	tobechecked	\N
58953	t	tobechecked	\N
58954	t	tobechecked	\N
58955	t	tobechecked	\N
58956	t	tobechecked	\N
58957	t	tobechecked	\N
58958	t	tobechecked	\N
58960	t	tobechecked	\N
58961	t	tobechecked	\N
58962	t	tobechecked	\N
58963	f	tobechecked	\N
58964	t	tobechecked	\N
58966	f	tobechecked	\N
58967	f	tobechecked	\N
58968	f	tobechecked	\N
58969	f	tobechecked	\N
58970	f	tobechecked	\N
58977	t	tobechecked	\N
58984	f	tobechecked	\N
58986	t	tobechecked	\N
58988	t	tobechecked	\N
58989	t	tobechecked	\N
58990	t	tobechecked	\N
58997	t	tobechecked	\N
58998	t	tobechecked	\N
58999	t	tobechecked	\N
59000	t	tobechecked	\N
59001	t	tobechecked	\N
59002	t	tobechecked	\N
59003	t	tobechecked	\N
59004	f	tobechecked	\N
59005	f	tobechecked	\N
59006	f	tobechecked	\N
59007	f	tobechecked	\N
59008	f	tobechecked	\N
59009	f	tobechecked	\N
59010	f	tobechecked	\N
59011	f	tobechecked	\N
59012	f	tobechecked	\N
59013	f	tobechecked	\N
59014	t	tobechecked	\N
59023	t	tobechecked	\N
59025	t	tobechecked	\N
59031	t	tobechecked	\N
59036	t	tobechecked	\N
59040	t	tobechecked	\N
59042	t	tobechecked	\N
59044	t	tobechecked	\N
59045	t	tobechecked	\N
59046	t	tobechecked	\N
59051	t	tobechecked	\N
59052	t	tobechecked	\N
59059	t	tobechecked	\N
59061	t	tobechecked	\N
59066	t	tobechecked	\N
59070	t	tobechecked	\N
59071	t	tobechecked	\N
59072	f	tobechecked	\N
59073	t	tobechecked	\N
59075	t	tobechecked	\N
59076	t	tobechecked	\N
59078	t	tobechecked	\N
59079	t	tobechecked	\N
59080	t	tobechecked	\N
59081	t	tobechecked	\N
59082	t	tobechecked	\N
59083	t	tobechecked	\N
59084	t	tobechecked	\N
59085	t	tobechecked	\N
59086	t	tobechecked	\N
59087	t	tobechecked	\N
59088	t	tobechecked	\N
59089	t	tobechecked	\N
59090	t	tobechecked	\N
59091	t	tobechecked	\N
59092	t	tobechecked	\N
59093	t	tobechecked	\N
59094	t	tobechecked	\N
59095	t	tobechecked	\N
59096	t	tobechecked	\N
59097	t	tobechecked	\N
59098	t	tobechecked	\N
59099	t	tobechecked	\N
59100	t	tobechecked	\N
59101	t	tobechecked	\N
59106	t	tobechecked	\N
59117	f	tobechecked	\N
59118	f	tobechecked	\N
59119	f	tobechecked	\N
59120	f	tobechecked	\N
59121	f	tobechecked	\N
59128	f	tobechecked	\N
59129	f	tobechecked	\N
59130	f	tobechecked	\N
59131	f	tobechecked	\N
59132	f	tobechecked	\N
59134	f	tobechecked	\N
59150	f	tobechecked	\N
59153	f	tobechecked	\N
59184	f	tobechecked	\N
59189	f	tobechecked	\N
59199	f	tobechecked	\N
59222	f	tobechecked	\N
59230	t	tobechecked	\N
59231	t	tobechecked	\N
59232	t	tobechecked	\N
59233	t	tobechecked	\N
59234	t	tobechecked	\N
59235	f	tobechecked	\N
59236	t	tobechecked	\N
59237	t	tobechecked	\N
59238	t	tobechecked	\N
59239	t	tobechecked	\N
59253	t	tobechecked	\N
59254	t	tobechecked	\N
59255	t	tobechecked	\N
59256	t	tobechecked	\N
59257	t	tobechecked	\N
59258	t	tobechecked	\N
59264	f	tobechecked	\N
59273	t	tobechecked	\N
59288	t	tobechecked	\N
59292	t	tobechecked	\N
59297	t	tobechecked	\N
59298	t	tobechecked	\N
59311	t	tobechecked	\N
59312	t	tobechecked	\N
59313	t	tobechecked	\N
59317	t	tobechecked	\N
59324	t	tobechecked	\N
59325	t	tobechecked	\N
59351	t	tobechecked	\N
59353	t	tobechecked	\N
59364	f	tobechecked	\N
59365	t	tobechecked	\N
59368	t	tobechecked	\N
59369	f	tobechecked	\N
59372	t	tobechecked	\N
59383	f	tobechecked	\N
59396	t	tobechecked	\N
59397	t	tobechecked	\N
59400	t	tobechecked	\N
59416	t	tobechecked	\N
59417	t	tobechecked	\N
59418	t	tobechecked	\N
59426	t	tobechecked	\N
59430	f	tobechecked	\N
59431	f	tobechecked	\N
59432	f	tobechecked	\N
59433	f	tobechecked	\N
59437	f	tobechecked	\N
59438	f	tobechecked	\N
59439	f	tobechecked	\N
59440	f	tobechecked	\N
59441	f	tobechecked	\N
59442	f	tobechecked	\N
59451	f	tobechecked	\N
59462	f	tobechecked	\N
59464	t	tobechecked	\N
59467	t	tobechecked	\N
59468	t	tobechecked	\N
59469	t	tobechecked	\N
59470	t	tobechecked	\N
59471	t	tobechecked	\N
59472	t	tobechecked	\N
59473	t	tobechecked	\N
59474	t	tobechecked	\N
59475	t	tobechecked	\N
59476	t	tobechecked	\N
59477	t	tobechecked	\N
59478	t	tobechecked	\N
59479	t	tobechecked	\N
59480	t	tobechecked	\N
59481	t	tobechecked	\N
59482	t	tobechecked	\N
59483	t	tobechecked	\N
59484	t	tobechecked	\N
59485	t	tobechecked	\N
59486	t	tobechecked	\N
59487	t	tobechecked	\N
59488	t	tobechecked	\N
59489	t	tobechecked	\N
59490	t	tobechecked	\N
59496	t	tobechecked	\N
59497	t	tobechecked	\N
59498	f	tobechecked	\N
59499	t	tobechecked	\N
59500	t	tobechecked	\N
59501	t	tobechecked	\N
59502	t	tobechecked	\N
59507	t	tobechecked	\N
59508	t	tobechecked	\N
59511	t	tobechecked	\N
59512	t	tobechecked	\N
59515	t	tobechecked	\N
59517	f	tobechecked	\N
59518	f	tobechecked	\N
59520	t	tobechecked	\N
59523	f	tobechecked	\N
59524	f	tobechecked	\N
59525	t	tobechecked	\N
59526	t	tobechecked	\N
59527	t	tobechecked	\N
59528	t	tobechecked	\N
59529	t	tobechecked	\N
59530	t	tobechecked	\N
59531	t	tobechecked	\N
59533	t	tobechecked	\N
59534	t	tobechecked	\N
59536	t	tobechecked	\N
59539	t	tobechecked	\N
59540	t	tobechecked	\N
59542	t	tobechecked	\N
59544	t	tobechecked	\N
59546	t	tobechecked	\N
59547	t	tobechecked	\N
59549	t	tobechecked	\N
59550	t	tobechecked	\N
59551	t	tobechecked	\N
59552	t	tobechecked	\N
59553	t	tobechecked	\N
59554	t	tobechecked	\N
59555	t	tobechecked	\N
59556	t	tobechecked	\N
59558	t	tobechecked	\N
59560	t	tobechecked	\N
59561	t	tobechecked	\N
59563	t	tobechecked	\N
59564	t	tobechecked	\N
59565	t	tobechecked	\N
59566	t	tobechecked	\N
59567	t	tobechecked	\N
59568	t	tobechecked	\N
59569	t	tobechecked	\N
59570	t	tobechecked	\N
59571	t	tobechecked	\N
59572	t	tobechecked	\N
59573	t	tobechecked	\N
59576	f	tobechecked	\N
59581	t	tobechecked	\N
59593	t	tobechecked	\N
59594	t	tobechecked	\N
59595	t	tobechecked	\N
59596	t	tobechecked	\N
59597	t	tobechecked	\N
59598	t	tobechecked	\N
59599	t	tobechecked	\N
59600	t	tobechecked	\N
59601	t	tobechecked	\N
59604	t	tobechecked	\N
59609	f	tobechecked	\N
59610	f	tobechecked	\N
59611	f	tobechecked	\N
59612	f	tobechecked	\N
59613	f	tobechecked	\N
59614	f	tobechecked	\N
59615	f	tobechecked	\N
59616	f	tobechecked	\N
59617	f	tobechecked	\N
59618	f	tobechecked	\N
59619	f	tobechecked	\N
59620	f	tobechecked	\N
59621	f	tobechecked	\N
59622	f	tobechecked	\N
59623	f	tobechecked	\N
59624	f	tobechecked	\N
59625	f	tobechecked	\N
59626	f	tobechecked	\N
59627	f	tobechecked	\N
59628	f	tobechecked	\N
59629	f	tobechecked	\N
59630	f	tobechecked	\N
59631	f	tobechecked	\N
59632	f	tobechecked	\N
59633	f	tobechecked	\N
59634	f	tobechecked	\N
59635	f	tobechecked	\N
59636	f	tobechecked	\N
59637	f	tobechecked	\N
59638	f	tobechecked	\N
59639	f	tobechecked	\N
59640	f	tobechecked	\N
59641	f	tobechecked	\N
59642	f	tobechecked	\N
59643	f	tobechecked	\N
59644	f	tobechecked	\N
59645	f	tobechecked	\N
59646	f	tobechecked	\N
59647	f	tobechecked	\N
59648	f	tobechecked	\N
59649	f	tobechecked	\N
59650	f	tobechecked	\N
59651	f	tobechecked	\N
59652	f	tobechecked	\N
59678	t	tobechecked	\N
59688	t	tobechecked	\N
59697	f	tobechecked	\N
59720	t	tobechecked	\N
59721	t	tobechecked	\N
59722	t	tobechecked	\N
59723	t	tobechecked	\N
59725	t	tobechecked	\N
59726	t	tobechecked	\N
59727	t	tobechecked	\N
59728	t	tobechecked	\N
59729	t	tobechecked	\N
59730	t	tobechecked	\N
59731	t	tobechecked	\N
59732	t	tobechecked	\N
59733	t	tobechecked	\N
59734	t	tobechecked	\N
59735	t	tobechecked	\N
59736	t	tobechecked	\N
59737	t	tobechecked	\N
59738	t	tobechecked	\N
59739	t	tobechecked	\N
59740	t	tobechecked	\N
59741	t	tobechecked	\N
59742	t	tobechecked	\N
59743	t	tobechecked	\N
59744	t	tobechecked	\N
59745	t	tobechecked	\N
59746	t	tobechecked	\N
59747	t	tobechecked	\N
59748	t	tobechecked	\N
59749	t	tobechecked	\N
59750	t	tobechecked	\N
59751	t	tobechecked	\N
59752	t	tobechecked	\N
59753	t	tobechecked	\N
59754	t	tobechecked	\N
59755	t	tobechecked	\N
59756	t	tobechecked	\N
59757	t	tobechecked	\N
59758	t	tobechecked	\N
59759	t	tobechecked	\N
59760	t	tobechecked	\N
59761	f	tobechecked	\N
59762	t	tobechecked	\N
59763	t	tobechecked	\N
59764	t	tobechecked	\N
59765	t	tobechecked	\N
59766	t	tobechecked	\N
59767	t	tobechecked	\N
59778	t	tobechecked	\N
59779	t	tobechecked	\N
59781	t	tobechecked	\N
59785	t	tobechecked	\N
59792	f	tobechecked	\N
59812	f	tobechecked	\N
59813	f	tobechecked	\N
59814	f	tobechecked	\N
59815	f	tobechecked	\N
59817	f	tobechecked	\N
59820	f	tobechecked	\N
59822	f	tobechecked	\N
59831	t	tobechecked	\N
59835	t	tobechecked	\N
59836	t	tobechecked	\N
59837	t	tobechecked	\N
59847	t	tobechecked	\N
59848	t	tobechecked	\N
59855	t	tobechecked	\N
59858	t	tobechecked	\N
59860	t	tobechecked	\N
59864	t	tobechecked	\N
59870	t	tobechecked	\N
59875	f	tobechecked	\N
59876	f	tobechecked	\N
59877	f	tobechecked	\N
59878	f	tobechecked	\N
59879	f	tobechecked	\N
59880	f	tobechecked	\N
59881	f	tobechecked	\N
59882	f	tobechecked	\N
59883	f	tobechecked	\N
59884	f	tobechecked	\N
59885	f	tobechecked	\N
59886	f	tobechecked	\N
59887	f	tobechecked	\N
59888	f	tobechecked	\N
59889	f	tobechecked	\N
59890	f	tobechecked	\N
59891	f	tobechecked	\N
59892	f	tobechecked	\N
59893	f	tobechecked	\N
59894	f	tobechecked	\N
59895	f	tobechecked	\N
59896	f	tobechecked	\N
59897	f	tobechecked	\N
59898	f	tobechecked	\N
59899	f	tobechecked	\N
59900	f	tobechecked	\N
59901	f	tobechecked	\N
59902	f	tobechecked	\N
59903	f	tobechecked	\N
59904	f	tobechecked	\N
59907	t	tobechecked	\N
59908	t	tobechecked	\N
59909	t	tobechecked	\N
59914	t	tobechecked	\N
59916	t	tobechecked	\N
59917	t	tobechecked	\N
59918	t	tobechecked	\N
59919	t	tobechecked	\N
59920	t	tobechecked	\N
59921	t	tobechecked	\N
59922	t	tobechecked	\N
59923	t	tobechecked	\N
59924	t	tobechecked	\N
59925	t	tobechecked	\N
59926	t	tobechecked	\N
59927	t	tobechecked	\N
59928	t	tobechecked	\N
59929	t	tobechecked	\N
59930	t	tobechecked	\N
59931	t	tobechecked	\N
59939	t	tobechecked	\N
59961	t	tobechecked	\N
59971	t	tobechecked	\N
60009	f	tobechecked	\N
60063	f	tobechecked	\N
60070	f	tobechecked	\N
60075	f	tobechecked	\N
60079	t	tobechecked	\N
60083	t	tobechecked	\N
60086	t	tobechecked	\N
60088	t	tobechecked	\N
60089	f	tobechecked	\N
60090	f	tobechecked	\N
60091	f	tobechecked	\N
60092	f	tobechecked	\N
60093	f	tobechecked	\N
60098	t	tobechecked	\N
60099	t	tobechecked	\N
60100	t	tobechecked	\N
60101	t	tobechecked	\N
60102	t	tobechecked	\N
60106	t	tobechecked	\N
60107	t	tobechecked	\N
60112	t	tobechecked	\N
60113	t	tobechecked	\N
60114	t	tobechecked	\N
60115	t	tobechecked	\N
60116	t	tobechecked	\N
60117	t	tobechecked	\N
60118	t	tobechecked	\N
60119	t	tobechecked	\N
60121	t	tobechecked	\N
60138	t	tobechecked	\N
60139	t	tobechecked	\N
60140	t	tobechecked	\N
60154	t	tobechecked	\N
60155	t	tobechecked	\N
60201	t	tobechecked	\N
60212	t	tobechecked	\N
60228	f	tobechecked	\N
60229	f	tobechecked	\N
60230	f	tobechecked	\N
60231	f	tobechecked	\N
60232	f	tobechecked	\N
60233	f	tobechecked	\N
60234	f	tobechecked	\N
60235	f	tobechecked	\N
60236	f	tobechecked	\N
60237	t	tobechecked	\N
60238	t	tobechecked	\N
60239	t	tobechecked	\N
60240	t	tobechecked	\N
60241	t	tobechecked	\N
60242	t	tobechecked	\N
60243	t	tobechecked	\N
60244	t	tobechecked	\N
60245	t	tobechecked	\N
60246	t	tobechecked	\N
60247	t	tobechecked	\N
60248	t	tobechecked	\N
60249	t	tobechecked	\N
60250	t	tobechecked	\N
60251	t	tobechecked	\N
60252	t	tobechecked	\N
60253	t	tobechecked	\N
60254	t	tobechecked	\N
60255	t	tobechecked	\N
60256	t	tobechecked	\N
60257	t	tobechecked	\N
60258	t	tobechecked	\N
60259	t	tobechecked	\N
60260	t	tobechecked	\N
60261	t	tobechecked	\N
60262	t	tobechecked	\N
60263	t	tobechecked	\N
60264	t	tobechecked	\N
60265	t	tobechecked	\N
60266	t	tobechecked	\N
60267	t	tobechecked	\N
60268	t	tobechecked	\N
60269	t	tobechecked	\N
60270	t	tobechecked	\N
60271	t	tobechecked	\N
60272	t	tobechecked	\N
60273	t	tobechecked	\N
60274	t	tobechecked	\N
60275	t	tobechecked	\N
60276	t	tobechecked	\N
60277	t	tobechecked	\N
60278	t	tobechecked	\N
60279	t	tobechecked	\N
60280	t	tobechecked	\N
60281	t	tobechecked	\N
60282	t	tobechecked	\N
60283	t	tobechecked	\N
60284	t	tobechecked	\N
60285	t	tobechecked	\N
60286	t	tobechecked	\N
60287	t	tobechecked	\N
60288	t	tobechecked	\N
60289	t	tobechecked	\N
60290	t	tobechecked	\N
60291	t	tobechecked	\N
60292	t	tobechecked	\N
60293	t	tobechecked	\N
60294	t	tobechecked	\N
60304	t	tobechecked	\N
60307	f	tobechecked	\N
60317	t	tobechecked	\N
60327	t	tobechecked	\N
60337	f	tobechecked	\N
60340	f	tobechecked	\N
60345	t	tobechecked	\N
60350	t	tobechecked	\N
60080	t	tobechecked	\N
60351	t	tobechecked	\N
60358	t	tobechecked	\N
60388	t	tobechecked	\N
60403	f	tobechecked	\N
60404	t	tobechecked	\N
60405	t	tobechecked	\N
60406	t	tobechecked	\N
60407	t	tobechecked	\N
60408	t	tobechecked	\N
60409	t	tobechecked	\N
60429	t	tobechecked	\N
60433	t	tobechecked	\N
60444	t	tobechecked	\N
60447	t	tobechecked	\N
60451	t	tobechecked	\N
60463	t	tobechecked	\N
60474	t	tobechecked	\N
60488	t	tobechecked	\N
60492	t	tobechecked	\N
60493	f	tobechecked	\N
60501	t	tobechecked	\N
60515	f	tobechecked	\N
60517	f	tobechecked	\N
60525	f	tobechecked	\N
60531	f	tobechecked	\N
60532	f	tobechecked	\N
60533	f	tobechecked	\N
60534	f	tobechecked	\N
60538	f	tobechecked	\N
60549	f	tobechecked	\N
60576	t	tobechecked	\N
60578	t	tobechecked	\N
60580	t	tobechecked	\N
60582	t	tobechecked	\N
60583	t	tobechecked	\N
60584	t	tobechecked	\N
60589	t	tobechecked	\N
60590	t	tobechecked	\N
60591	t	tobechecked	\N
60592	t	tobechecked	\N
60593	t	tobechecked	\N
60594	t	tobechecked	\N
60595	t	tobechecked	\N
60596	t	tobechecked	\N
60599	t	tobechecked	\N
60602	t	tobechecked	\N
60606	t	tobechecked	\N
60609	t	tobechecked	\N
60610	t	tobechecked	\N
60611	t	tobechecked	\N
60613	t	tobechecked	\N
60614	t	tobechecked	\N
60615	t	tobechecked	\N
60616	t	tobechecked	\N
60617	t	tobechecked	\N
60618	t	tobechecked	\N
60619	t	tobechecked	\N
60620	t	tobechecked	\N
60621	t	tobechecked	\N
60622	t	tobechecked	\N
60623	t	tobechecked	\N
60624	t	tobechecked	\N
60625	t	tobechecked	\N
60626	t	tobechecked	\N
60627	t	tobechecked	\N
60628	t	tobechecked	\N
60629	t	tobechecked	\N
60630	t	tobechecked	\N
60631	t	tobechecked	\N
60632	t	tobechecked	\N
60633	t	tobechecked	\N
60634	t	tobechecked	\N
60635	t	tobechecked	\N
60636	t	tobechecked	\N
60637	t	tobechecked	\N
60638	t	tobechecked	\N
60641	t	tobechecked	\N
60653	t	tobechecked	\N
60665	t	tobechecked	\N
60684	t	tobechecked	\N
60685	f	tobechecked	\N
60686	f	tobechecked	\N
60687	f	tobechecked	\N
60688	f	tobechecked	\N
60689	f	tobechecked	\N
60690	f	tobechecked	\N
60691	f	tobechecked	\N
60692	f	tobechecked	\N
60693	f	tobechecked	\N
60694	f	tobechecked	\N
60695	f	tobechecked	\N
60696	f	tobechecked	\N
60697	f	tobechecked	\N
60698	f	tobechecked	\N
60699	f	tobechecked	\N
60700	f	tobechecked	\N
60718	t	tobechecked	\N
60719	t	tobechecked	\N
60720	t	tobechecked	\N
60721	t	tobechecked	\N
60722	t	tobechecked	\N
60723	t	tobechecked	\N
60724	t	tobechecked	\N
60725	t	tobechecked	\N
60727	t	tobechecked	\N
60728	t	tobechecked	\N
60729	t	tobechecked	\N
60730	t	tobechecked	\N
60731	t	tobechecked	\N
60732	t	tobechecked	\N
60733	t	tobechecked	\N
60739	t	tobechecked	\N
60740	t	tobechecked	\N
60741	t	tobechecked	\N
60742	t	tobechecked	\N
60745	t	tobechecked	\N
60753	f	tobechecked	\N
60762	f	tobechecked	\N
60763	f	tobechecked	\N
60764	f	tobechecked	\N
60776	f	tobechecked	\N
60777	f	tobechecked	\N
60780	f	tobechecked	\N
60781	f	tobechecked	\N
60785	f	tobechecked	\N
60792	f	tobechecked	\N
60806	f	tobechecked	\N
60842	t	tobechecked	\N
60843	t	tobechecked	\N
60844	t	tobechecked	\N
60845	t	tobechecked	\N
60846	f	tobechecked	\N
60847	f	tobechecked	\N
60848	f	tobechecked	\N
60853	t	tobechecked	\N
60854	t	tobechecked	\N
60868	t	tobechecked	\N
60869	t	tobechecked	\N
60870	t	tobechecked	\N
60872	t	tobechecked	\N
60873	f	tobechecked	\N
60874	t	tobechecked	\N
60875	t	tobechecked	\N
60876	t	tobechecked	\N
60879	t	tobechecked	\N
60880	t	tobechecked	\N
60884	t	tobechecked	\N
60885	t	tobechecked	\N
60886	t	tobechecked	\N
60907	t	tobechecked	\N
60923	t	tobechecked	\N
60969	t	tobechecked	\N
60970	t	tobechecked	\N
60971	t	tobechecked	\N
60973	t	tobechecked	\N
60976	t	tobechecked	\N
60979	t	tobechecked	\N
60992	t	tobechecked	\N
60993	t	tobechecked	\N
60994	t	tobechecked	\N
60995	t	tobechecked	\N
60996	t	tobechecked	\N
60997	t	tobechecked	\N
60998	t	tobechecked	\N
60999	t	tobechecked	\N
61000	t	tobechecked	\N
61001	t	tobechecked	\N
61002	t	tobechecked	\N
61003	t	tobechecked	\N
61004	t	tobechecked	\N
61005	t	tobechecked	\N
61006	t	tobechecked	\N
61007	t	tobechecked	\N
61008	t	tobechecked	\N
61009	t	tobechecked	\N
61010	t	tobechecked	\N
61011	t	tobechecked	\N
61012	t	tobechecked	\N
61014	f	tobechecked	\N
61015	t	tobechecked	\N
61016	f	tobechecked	\N
61017	t	tobechecked	\N
61019	f	tobechecked	\N
61020	t	tobechecked	\N
61021	t	tobechecked	\N
61030	t	tobechecked	\N
61031	t	tobechecked	\N
61032	t	tobechecked	\N
61035	t	tobechecked	\N
61039	f	tobechecked	\N
61041	t	tobechecked	\N
61049	t	tobechecked	\N
61055	t	tobechecked	\N
61056	t	tobechecked	\N
61058	t	tobechecked	\N
61059	t	tobechecked	\N
61060	t	tobechecked	\N
61062	f	tobechecked	\N
61065	t	tobechecked	\N
61068	t	tobechecked	\N
61073	t	tobechecked	\N
61075	t	tobechecked	\N
61078	t	tobechecked	\N
61079	t	tobechecked	\N
61080	t	tobechecked	\N
61087	t	tobechecked	\N
61089	t	tobechecked	\N
61090	t	tobechecked	\N
61105	t	tobechecked	\N
61109	t	tobechecked	\N
61115	t	tobechecked	\N
61141	f	tobechecked	\N
61142	f	tobechecked	\N
61143	f	tobechecked	\N
61145	f	tobechecked	\N
61146	f	tobechecked	\N
61147	f	tobechecked	\N
61148	f	tobechecked	\N
61149	f	tobechecked	\N
61150	f	tobechecked	\N
61151	f	tobechecked	\N
61152	f	tobechecked	\N
61153	f	tobechecked	\N
61154	f	tobechecked	\N
61155	f	tobechecked	\N
61156	f	tobechecked	\N
61157	f	tobechecked	\N
61158	f	tobechecked	\N
61159	f	tobechecked	\N
61160	f	tobechecked	\N
61209	t	tobechecked	\N
61213	t	tobechecked	\N
61224	t	tobechecked	\N
61225	f	tobechecked	\N
61226	f	tobechecked	\N
61227	f	tobechecked	\N
61228	f	tobechecked	\N
61229	f	tobechecked	\N
61230	f	tobechecked	\N
61278	f	tobechecked	\N
61280	t	tobechecked	\N
61281	t	tobechecked	\N
61284	t	tobechecked	\N
61288	t	tobechecked	\N
61289	t	tobechecked	\N
61296	t	tobechecked	\N
61310	t	tobechecked	\N
61313	t	tobechecked	\N
61315	t	tobechecked	\N
61316	t	tobechecked	\N
61317	t	tobechecked	\N
61318	t	tobechecked	\N
61319	t	tobechecked	\N
61320	t	tobechecked	\N
61322	t	tobechecked	\N
61323	t	tobechecked	\N
61324	t	tobechecked	\N
61325	t	tobechecked	\N
61326	t	tobechecked	\N
61327	t	tobechecked	\N
61328	t	tobechecked	\N
61329	t	tobechecked	\N
61330	t	tobechecked	\N
61331	t	tobechecked	\N
61332	t	tobechecked	\N
61333	t	tobechecked	\N
61334	t	tobechecked	\N
61335	t	tobechecked	\N
61336	t	tobechecked	\N
61337	t	tobechecked	\N
61338	t	tobechecked	\N
61341	t	tobechecked	\N
61343	t	tobechecked	\N
61345	t	tobechecked	\N
61346	t	tobechecked	\N
61347	t	tobechecked	\N
61348	t	tobechecked	\N
61349	t	tobechecked	\N
61350	t	tobechecked	\N
61351	t	tobechecked	\N
61352	t	tobechecked	\N
61353	t	tobechecked	\N
61354	t	tobechecked	\N
61355	t	tobechecked	\N
61356	t	tobechecked	\N
61357	t	tobechecked	\N
61358	t	tobechecked	\N
61359	t	tobechecked	\N
61361	t	tobechecked	\N
61364	t	tobechecked	\N
61369	t	tobechecked	\N
61370	t	tobechecked	\N
61372	t	tobechecked	\N
61373	t	tobechecked	\N
61374	t	tobechecked	\N
61375	t	tobechecked	\N
61377	t	tobechecked	\N
61380	t	tobechecked	\N
61381	t	tobechecked	\N
61383	t	tobechecked	\N
61384	t	tobechecked	\N
61386	t	tobechecked	\N
61387	t	tobechecked	\N
61388	t	tobechecked	\N
61389	t	tobechecked	\N
61396	t	tobechecked	\N
61402	t	tobechecked	\N
61403	t	tobechecked	\N
61404	t	tobechecked	\N
61405	t	tobechecked	\N
61406	t	tobechecked	\N
61407	t	tobechecked	\N
61411	t	tobechecked	\N
61412	t	tobechecked	\N
61413	t	tobechecked	\N
61414	t	tobechecked	\N
61416	t	tobechecked	\N
61428	t	tobechecked	\N
61429	t	tobechecked	\N
61439	t	tobechecked	\N
61442	t	tobechecked	\N
61443	t	tobechecked	\N
61444	t	tobechecked	\N
61445	t	tobechecked	\N
61446	t	tobechecked	\N
61447	t	tobechecked	\N
61448	t	tobechecked	\N
61449	t	tobechecked	\N
61451	t	tobechecked	\N
61452	t	tobechecked	\N
61454	t	tobechecked	\N
61457	t	tobechecked	\N
61458	t	tobechecked	\N
61459	t	tobechecked	\N
61460	t	tobechecked	\N
61461	t	tobechecked	\N
61462	t	tobechecked	\N
61463	t	tobechecked	\N
61464	t	tobechecked	\N
61471	f	tobechecked	\N
61472	f	tobechecked	\N
61473	f	tobechecked	\N
61474	f	tobechecked	\N
61475	f	tobechecked	\N
61476	f	tobechecked	\N
61477	f	tobechecked	\N
61478	f	tobechecked	\N
61479	f	tobechecked	\N
61480	f	tobechecked	\N
61481	f	tobechecked	\N
61482	f	tobechecked	\N
61483	f	tobechecked	\N
61484	f	tobechecked	\N
61485	f	tobechecked	\N
61486	f	tobechecked	\N
61487	f	tobechecked	\N
61488	f	tobechecked	\N
61489	f	tobechecked	\N
61490	f	tobechecked	\N
61491	f	tobechecked	\N
61492	f	tobechecked	\N
61493	f	tobechecked	\N
61494	f	tobechecked	\N
61495	f	tobechecked	\N
61496	f	tobechecked	\N
61497	f	tobechecked	\N
61498	f	tobechecked	\N
61499	f	tobechecked	\N
61500	f	tobechecked	\N
61501	f	tobechecked	\N
61502	f	tobechecked	\N
61503	f	tobechecked	\N
61504	f	tobechecked	\N
61505	f	tobechecked	\N
61506	f	tobechecked	\N
61507	f	tobechecked	\N
61508	f	tobechecked	\N
61509	f	tobechecked	\N
61510	f	tobechecked	\N
61511	f	tobechecked	\N
61512	f	tobechecked	\N
61513	f	tobechecked	\N
61514	f	tobechecked	\N
61515	f	tobechecked	\N
61516	f	tobechecked	\N
61517	f	tobechecked	\N
61518	f	tobechecked	\N
61519	f	tobechecked	\N
61520	f	tobechecked	\N
61521	f	tobechecked	\N
61522	f	tobechecked	\N
61523	f	tobechecked	\N
61524	f	tobechecked	\N
61525	f	tobechecked	\N
61526	f	tobechecked	\N
61527	f	tobechecked	\N
61528	f	tobechecked	\N
61529	f	tobechecked	\N
61530	f	tobechecked	\N
61531	f	tobechecked	\N
61532	f	tobechecked	\N
61533	f	tobechecked	\N
61534	f	tobechecked	\N
61535	f	tobechecked	\N
61536	f	tobechecked	\N
61537	f	tobechecked	\N
61538	f	tobechecked	\N
61539	f	tobechecked	\N
61540	f	tobechecked	\N
61541	f	tobechecked	\N
61542	f	tobechecked	\N
61543	f	tobechecked	\N
61544	f	tobechecked	\N
61545	f	tobechecked	\N
61546	f	tobechecked	\N
61547	f	tobechecked	\N
61548	f	tobechecked	\N
61549	f	tobechecked	\N
61550	f	tobechecked	\N
61551	f	tobechecked	\N
61552	t	tobechecked	\N
61553	t	tobechecked	\N
61554	t	tobechecked	\N
61555	t	tobechecked	\N
61556	t	tobechecked	\N
61557	t	tobechecked	\N
61558	t	tobechecked	\N
61559	t	tobechecked	\N
61560	t	tobechecked	\N
61561	t	tobechecked	\N
61562	t	tobechecked	\N
61563	t	tobechecked	\N
61564	t	tobechecked	\N
61565	t	tobechecked	\N
61566	t	tobechecked	\N
61567	t	tobechecked	\N
61568	t	tobechecked	\N
61569	t	tobechecked	\N
61570	t	tobechecked	\N
61571	t	tobechecked	\N
61572	t	tobechecked	\N
61573	t	tobechecked	\N
61574	t	tobechecked	\N
61575	t	tobechecked	\N
61576	t	tobechecked	\N
61577	t	tobechecked	\N
61578	t	tobechecked	\N
61579	t	tobechecked	\N
61580	t	tobechecked	\N
61581	t	tobechecked	\N
61582	t	tobechecked	\N
61583	t	tobechecked	\N
61584	t	tobechecked	\N
61585	t	tobechecked	\N
61586	t	tobechecked	\N
61587	t	tobechecked	\N
61588	t	tobechecked	\N
61589	t	tobechecked	\N
61590	t	tobechecked	\N
61591	f	tobechecked	\N
61592	t	tobechecked	\N
61593	t	tobechecked	\N
61594	t	tobechecked	\N
61595	t	tobechecked	\N
61596	t	tobechecked	\N
61597	t	tobechecked	\N
61598	t	tobechecked	\N
61599	t	tobechecked	\N
61600	t	tobechecked	\N
61601	t	tobechecked	\N
61602	t	tobechecked	\N
61603	t	tobechecked	\N
61604	t	tobechecked	\N
61605	t	tobechecked	\N
61606	t	tobechecked	\N
61607	t	tobechecked	\N
61608	t	tobechecked	\N
61609	t	tobechecked	\N
61610	t	tobechecked	\N
61611	t	tobechecked	\N
61612	t	tobechecked	\N
61613	t	tobechecked	\N
61614	t	tobechecked	\N
61615	t	tobechecked	\N
61616	t	tobechecked	\N
61617	t	tobechecked	\N
61618	t	tobechecked	\N
61619	t	tobechecked	\N
61620	t	tobechecked	\N
61621	t	tobechecked	\N
61622	t	tobechecked	\N
61623	t	tobechecked	\N
61624	t	tobechecked	\N
61625	t	tobechecked	\N
61626	t	tobechecked	\N
61627	t	tobechecked	\N
61628	t	tobechecked	\N
61629	t	tobechecked	\N
61630	t	tobechecked	\N
61631	t	tobechecked	\N
61632	t	tobechecked	\N
61633	t	tobechecked	\N
61634	t	tobechecked	\N
61644	t	tobechecked	\N
61645	t	tobechecked	\N
61648	t	tobechecked	\N
61651	t	tobechecked	\N
61652	t	tobechecked	\N
61653	t	tobechecked	\N
61654	t	tobechecked	\N
61655	t	tobechecked	\N
61656	t	tobechecked	\N
61663	t	tobechecked	\N
61667	t	tobechecked	\N
61668	f	tobechecked	\N
61669	t	tobechecked	\N
61670	t	tobechecked	\N
61671	t	tobechecked	\N
61673	t	tobechecked	\N
61674	t	tobechecked	\N
61675	t	tobechecked	\N
61676	t	tobechecked	\N
61681	t	tobechecked	\N
61682	t	tobechecked	\N
61683	t	tobechecked	\N
61684	t	tobechecked	\N
61694	t	tobechecked	\N
61702	t	tobechecked	\N
61707	t	tobechecked	\N
61708	t	tobechecked	\N
61712	t	tobechecked	\N
61713	t	tobechecked	\N
61724	t	tobechecked	\N
61725	t	tobechecked	\N
61747	f	tobechecked	\N
61763	t	tobechecked	\N
61764	t	tobechecked	\N
61765	t	tobechecked	\N
61766	t	tobechecked	\N
61767	t	tobechecked	\N
61768	t	tobechecked	\N
61769	t	tobechecked	\N
61770	t	tobechecked	\N
61771	t	tobechecked	\N
61772	t	tobechecked	\N
61773	t	tobechecked	\N
61774	t	tobechecked	\N
61775	t	tobechecked	\N
61776	t	tobechecked	\N
61777	t	tobechecked	\N
61778	t	tobechecked	\N
61779	t	tobechecked	\N
61780	t	tobechecked	\N
61781	t	tobechecked	\N
61782	t	tobechecked	\N
61783	t	tobechecked	\N
61784	t	tobechecked	\N
61786	t	tobechecked	\N
61787	t	tobechecked	\N
61788	t	tobechecked	\N
61789	t	tobechecked	\N
61790	t	tobechecked	\N
61819	t	tobechecked	\N
61882	t	tobechecked	\N
61885	t	tobechecked	\N
61887	t	tobechecked	\N
61897	t	tobechecked	\N
61941	t	tobechecked	\N
61942	t	tobechecked	\N
61965	t	tobechecked	\N
61972	f	tobechecked	\N
61973	f	tobechecked	\N
61974	f	tobechecked	\N
61975	f	tobechecked	\N
61976	f	tobechecked	\N
61977	f	tobechecked	\N
61978	f	tobechecked	\N
61979	f	tobechecked	\N
61980	f	tobechecked	\N
61981	f	tobechecked	\N
61982	f	tobechecked	\N
61983	f	tobechecked	\N
61984	f	tobechecked	\N
61985	f	tobechecked	\N
61986	f	tobechecked	\N
61987	f	tobechecked	\N
61988	f	tobechecked	\N
61989	f	tobechecked	\N
61990	f	tobechecked	\N
61991	f	tobechecked	\N
61992	f	tobechecked	\N
61993	f	tobechecked	\N
61994	f	tobechecked	\N
61995	f	tobechecked	\N
61996	f	tobechecked	\N
61997	f	tobechecked	\N
61998	f	tobechecked	\N
61999	f	tobechecked	\N
62000	f	tobechecked	\N
62001	f	tobechecked	\N
62002	f	tobechecked	\N
62003	f	tobechecked	\N
62004	f	tobechecked	\N
62005	f	tobechecked	\N
62006	f	tobechecked	\N
62007	f	tobechecked	\N
62008	f	tobechecked	\N
62025	t	tobechecked	\N
62069	f	tobechecked	\N
62070	f	tobechecked	\N
62071	f	tobechecked	\N
62072	f	tobechecked	\N
62073	f	tobechecked	\N
62074	f	tobechecked	\N
62075	f	tobechecked	\N
62076	f	tobechecked	\N
62077	f	tobechecked	\N
62078	f	tobechecked	\N
62079	f	tobechecked	\N
62080	f	tobechecked	\N
62081	f	tobechecked	\N
62082	f	tobechecked	\N
62083	f	tobechecked	\N
62084	f	tobechecked	\N
62085	f	tobechecked	\N
62086	f	tobechecked	\N
62087	f	tobechecked	\N
62088	f	tobechecked	\N
62089	f	tobechecked	\N
62090	f	tobechecked	\N
62091	f	tobechecked	\N
62092	f	tobechecked	\N
62093	f	tobechecked	\N
62094	f	tobechecked	\N
62095	t	tobechecked	\N
62096	t	tobechecked	\N
62097	t	tobechecked	\N
62098	t	tobechecked	\N
62099	f	tobechecked	\N
62131	f	tobechecked	\N
62132	f	tobechecked	\N
62133	f	tobechecked	\N
62134	f	tobechecked	\N
62135	f	tobechecked	\N
62136	f	tobechecked	\N
62137	f	tobechecked	\N
62138	f	tobechecked	\N
62139	f	tobechecked	\N
62140	f	tobechecked	\N
62141	f	tobechecked	\N
62142	f	tobechecked	\N
62144	t	tobechecked	\N
62148	t	tobechecked	\N
62157	t	tobechecked	\N
62163	t	tobechecked	\N
62166	t	tobechecked	\N
62168	t	tobechecked	\N
62170	t	tobechecked	\N
62171	t	tobechecked	\N
62172	t	tobechecked	\N
62198	t	tobechecked	\N
62199	t	tobechecked	\N
62201	t	tobechecked	\N
62202	t	tobechecked	\N
62203	t	tobechecked	\N
62204	t	tobechecked	\N
62205	t	tobechecked	\N
62207	t	tobechecked	\N
62208	t	tobechecked	\N
62209	t	tobechecked	\N
62210	f	tobechecked	\N
62211	f	tobechecked	\N
62212	f	tobechecked	\N
62213	f	tobechecked	\N
62214	f	tobechecked	\N
62215	f	tobechecked	\N
62216	f	tobechecked	\N
62217	f	tobechecked	\N
62218	f	tobechecked	\N
62219	f	tobechecked	\N
62220	f	tobechecked	\N
62221	f	tobechecked	\N
62222	f	tobechecked	\N
62223	f	tobechecked	\N
62224	f	tobechecked	\N
62225	f	tobechecked	\N
62226	f	tobechecked	\N
62227	t	tobechecked	\N
62231	t	tobechecked	\N
62232	t	tobechecked	\N
62233	t	tobechecked	\N
62234	t	tobechecked	\N
62235	t	tobechecked	\N
62236	t	tobechecked	\N
62237	t	tobechecked	\N
62238	t	tobechecked	\N
62239	t	tobechecked	\N
62240	t	tobechecked	\N
62241	t	tobechecked	\N
62242	t	tobechecked	\N
62243	t	tobechecked	\N
62244	t	tobechecked	\N
62245	t	tobechecked	\N
62246	t	tobechecked	\N
62247	t	tobechecked	\N
62248	t	tobechecked	\N
62249	t	tobechecked	\N
62250	t	tobechecked	\N
62251	t	tobechecked	\N
62252	t	tobechecked	\N
62254	t	tobechecked	\N
62255	t	tobechecked	\N
62256	t	tobechecked	\N
62257	t	tobechecked	\N
62258	t	tobechecked	\N
62259	t	tobechecked	\N
62260	t	tobechecked	\N
62261	t	tobechecked	\N
62262	t	tobechecked	\N
62309	t	tobechecked	\N
62325	t	tobechecked	\N
62334	t	tobechecked	\N
62339	t	tobechecked	\N
62369	t	tobechecked	\N
62370	t	tobechecked	\N
62378	t	tobechecked	\N
62402	t	tobechecked	\N
62409	t	tobechecked	\N
62438	t	tobechecked	\N
62444	t	tobechecked	\N
62454	t	tobechecked	\N
62459	t	tobechecked	\N
62460	t	tobechecked	\N
62470	t	tobechecked	\N
62486	t	tobechecked	\N
62504	f	tobechecked	\N
62505	f	tobechecked	\N
62506	f	tobechecked	\N
62507	f	tobechecked	\N
62508	f	tobechecked	\N
62509	f	tobechecked	\N
62510	f	tobechecked	\N
62511	f	tobechecked	\N
62512	f	tobechecked	\N
62513	f	tobechecked	\N
62514	f	tobechecked	\N
62515	f	tobechecked	\N
62516	f	tobechecked	\N
62517	f	tobechecked	\N
62518	f	tobechecked	\N
62519	f	tobechecked	\N
62520	f	tobechecked	\N
62521	f	tobechecked	\N
62522	f	tobechecked	\N
62523	f	tobechecked	\N
62524	f	tobechecked	\N
62525	f	tobechecked	\N
62526	f	tobechecked	\N
62527	f	tobechecked	\N
62528	f	tobechecked	\N
62529	f	tobechecked	\N
62530	f	tobechecked	\N
62531	f	tobechecked	\N
62532	f	tobechecked	\N
62533	f	tobechecked	\N
62534	f	tobechecked	\N
62535	f	tobechecked	\N
62536	f	tobechecked	\N
62537	f	tobechecked	\N
62538	f	tobechecked	\N
62539	f	tobechecked	\N
62540	f	tobechecked	\N
62541	f	tobechecked	\N
62542	f	tobechecked	\N
62543	f	tobechecked	\N
62544	f	tobechecked	\N
62545	f	tobechecked	\N
62546	f	tobechecked	\N
62547	f	tobechecked	\N
62548	f	tobechecked	\N
62549	f	tobechecked	\N
62550	f	tobechecked	\N
62551	f	tobechecked	\N
62552	f	tobechecked	\N
62553	f	tobechecked	\N
62554	f	tobechecked	\N
62555	f	tobechecked	\N
62556	f	tobechecked	\N
62557	f	tobechecked	\N
62558	f	tobechecked	\N
62559	f	tobechecked	\N
62560	f	tobechecked	\N
62561	f	tobechecked	\N
62562	f	tobechecked	\N
62563	f	tobechecked	\N
62564	f	tobechecked	\N
62565	f	tobechecked	\N
62566	f	tobechecked	\N
62567	f	tobechecked	\N
62568	f	tobechecked	\N
62569	f	tobechecked	\N
62570	f	tobechecked	\N
62571	f	tobechecked	\N
62572	f	tobechecked	\N
62573	f	tobechecked	\N
62574	f	tobechecked	\N
62575	f	tobechecked	\N
62576	f	tobechecked	\N
62577	f	tobechecked	\N
62578	f	tobechecked	\N
62579	f	tobechecked	\N
62580	f	tobechecked	\N
62581	f	tobechecked	\N
62582	f	tobechecked	\N
62583	f	tobechecked	\N
62584	f	tobechecked	\N
62585	f	tobechecked	\N
62586	f	tobechecked	\N
62587	f	tobechecked	\N
62588	f	tobechecked	\N
62589	f	tobechecked	\N
62590	f	tobechecked	\N
62591	f	tobechecked	\N
62592	f	tobechecked	\N
62593	f	tobechecked	\N
62594	f	tobechecked	\N
62597	f	tobechecked	\N
62600	f	tobechecked	\N
62601	f	tobechecked	\N
62610	f	tobechecked	\N
62615	f	tobechecked	\N
62617	f	tobechecked	\N
62648	f	tobechecked	\N
62662	t	tobechecked	\N
62667	f	tobechecked	\N
62668	f	tobechecked	\N
62669	f	tobechecked	\N
62670	f	tobechecked	\N
62671	f	tobechecked	\N
62672	f	tobechecked	\N
62673	f	tobechecked	\N
62674	f	tobechecked	\N
62675	f	tobechecked	\N
62676	f	tobechecked	\N
62677	f	tobechecked	\N
62678	f	tobechecked	\N
62679	f	tobechecked	\N
62680	f	tobechecked	\N
62681	f	tobechecked	\N
62682	f	tobechecked	\N
62683	f	tobechecked	\N
62684	f	tobechecked	\N
62685	f	tobechecked	\N
62686	f	tobechecked	\N
62687	f	tobechecked	\N
62688	f	tobechecked	\N
62689	f	tobechecked	\N
62690	f	tobechecked	\N
62691	f	tobechecked	\N
62692	f	tobechecked	\N
62693	f	tobechecked	\N
62694	f	tobechecked	\N
62695	f	tobechecked	\N
62696	f	tobechecked	\N
62697	f	tobechecked	\N
62698	f	tobechecked	\N
62699	f	tobechecked	\N
62700	f	tobechecked	\N
62701	f	tobechecked	\N
62702	f	tobechecked	\N
62703	f	tobechecked	\N
62704	f	tobechecked	\N
62705	f	tobechecked	\N
62706	f	tobechecked	\N
62707	f	tobechecked	\N
62708	f	tobechecked	\N
62709	f	tobechecked	\N
62710	f	tobechecked	\N
62711	f	tobechecked	\N
62712	f	tobechecked	\N
62713	f	tobechecked	\N
62714	f	tobechecked	\N
62715	f	tobechecked	\N
62716	f	tobechecked	\N
62717	f	tobechecked	\N
62718	f	tobechecked	\N
62719	f	tobechecked	\N
62720	f	tobechecked	\N
62721	f	tobechecked	\N
62722	f	tobechecked	\N
62723	f	tobechecked	\N
62724	f	tobechecked	\N
62725	f	tobechecked	\N
62726	f	tobechecked	\N
62727	f	tobechecked	\N
62728	f	tobechecked	\N
62729	f	tobechecked	\N
62730	f	tobechecked	\N
62731	f	tobechecked	\N
62732	f	tobechecked	\N
62733	f	tobechecked	\N
62734	f	tobechecked	\N
62735	f	tobechecked	\N
62736	f	tobechecked	\N
62737	f	tobechecked	\N
62738	f	tobechecked	\N
62739	f	tobechecked	\N
62740	f	tobechecked	\N
62741	f	tobechecked	\N
62742	f	tobechecked	\N
62743	f	tobechecked	\N
62744	f	tobechecked	\N
62745	f	tobechecked	\N
62746	f	tobechecked	\N
62747	f	tobechecked	\N
62748	f	tobechecked	\N
62749	f	tobechecked	\N
62750	f	tobechecked	\N
62751	f	tobechecked	\N
62752	f	tobechecked	\N
62753	f	tobechecked	\N
62754	f	tobechecked	\N
62755	f	tobechecked	\N
62756	f	tobechecked	\N
62757	f	tobechecked	\N
62758	f	tobechecked	\N
62759	f	tobechecked	\N
62760	f	tobechecked	\N
62761	f	tobechecked	\N
62762	f	tobechecked	\N
62763	f	tobechecked	\N
62764	f	tobechecked	\N
62765	f	tobechecked	\N
62766	f	tobechecked	\N
62767	f	tobechecked	\N
62768	f	tobechecked	\N
62769	f	tobechecked	\N
62770	f	tobechecked	\N
62771	f	tobechecked	\N
62772	f	tobechecked	\N
62773	f	tobechecked	\N
62774	f	tobechecked	\N
62775	f	tobechecked	\N
62776	f	tobechecked	\N
62777	f	tobechecked	\N
62778	f	tobechecked	\N
62779	f	tobechecked	\N
62780	f	tobechecked	\N
62781	f	tobechecked	\N
62782	f	tobechecked	\N
62783	f	tobechecked	\N
62784	f	tobechecked	\N
62785	f	tobechecked	\N
62786	f	tobechecked	\N
62787	f	tobechecked	\N
62788	f	tobechecked	\N
62789	f	tobechecked	\N
62790	f	tobechecked	\N
62791	f	tobechecked	\N
62792	f	tobechecked	\N
62793	f	tobechecked	\N
62794	f	tobechecked	\N
62795	f	tobechecked	\N
62796	f	tobechecked	\N
62797	f	tobechecked	\N
62798	f	tobechecked	\N
62799	f	tobechecked	\N
62800	f	tobechecked	\N
62801	f	tobechecked	\N
62802	f	tobechecked	\N
62803	f	tobechecked	\N
62804	f	tobechecked	\N
62805	f	tobechecked	\N
62806	f	tobechecked	\N
62807	f	tobechecked	\N
62808	f	tobechecked	\N
62809	f	tobechecked	\N
62810	f	tobechecked	\N
62811	f	tobechecked	\N
62812	f	tobechecked	\N
62813	f	tobechecked	\N
62814	f	tobechecked	\N
62815	f	tobechecked	\N
62816	f	tobechecked	\N
62817	f	tobechecked	\N
62818	f	tobechecked	\N
62819	f	tobechecked	\N
62820	f	tobechecked	\N
62821	f	tobechecked	\N
62822	f	tobechecked	\N
62823	f	tobechecked	\N
62824	f	tobechecked	\N
62838	f	tobechecked	\N
62847	t	tobechecked	\N
62855	t	tobechecked	\N
62880	t	tobechecked	\N
62881	t	tobechecked	\N
62890	f	tobechecked	\N
62891	t	tobechecked	\N
62892	t	tobechecked	\N
62893	t	tobechecked	\N
62894	t	tobechecked	\N
62895	t	tobechecked	\N
62896	t	tobechecked	\N
62897	t	tobechecked	\N
62898	t	tobechecked	\N
62928	f	tobechecked	\N
62935	t	tobechecked	\N
62936	t	tobechecked	\N
62937	t	tobechecked	\N
62946	t	tobechecked	\N
62947	t	tobechecked	\N
62950	t	tobechecked	\N
62952	t	tobechecked	\N
62953	t	tobechecked	\N
62963	t	tobechecked	\N
62964	f	tobechecked	\N
62965	f	tobechecked	\N
62966	f	tobechecked	\N
62967	f	tobechecked	\N
62968	f	tobechecked	\N
62969	f	tobechecked	\N
62970	f	tobechecked	\N
62971	f	tobechecked	\N
62972	f	tobechecked	\N
63045	t	tobechecked	\N
63059	t	tobechecked	\N
63060	f	tobechecked	\N
63061	f	tobechecked	\N
63062	f	tobechecked	\N
63063	f	tobechecked	\N
63064	f	tobechecked	\N
63065	f	tobechecked	\N
63066	f	tobechecked	\N
63067	f	tobechecked	\N
63068	f	tobechecked	\N
63069	f	tobechecked	\N
63070	f	tobechecked	\N
63071	f	tobechecked	\N
63072	f	tobechecked	\N
63073	f	tobechecked	\N
63074	f	tobechecked	\N
63075	f	tobechecked	\N
63076	f	tobechecked	\N
63077	f	tobechecked	\N
63078	f	tobechecked	\N
63079	f	tobechecked	\N
63080	f	tobechecked	\N
63081	f	tobechecked	\N
63082	f	tobechecked	\N
63083	f	tobechecked	\N
63084	f	tobechecked	\N
63085	f	tobechecked	\N
63086	f	tobechecked	\N
63087	f	tobechecked	\N
63088	f	tobechecked	\N
63089	f	tobechecked	\N
63090	f	tobechecked	\N
63091	f	tobechecked	\N
63092	f	tobechecked	\N
63093	f	tobechecked	\N
63094	f	tobechecked	\N
63095	f	tobechecked	\N
63096	f	tobechecked	\N
63097	f	tobechecked	\N
63098	f	tobechecked	\N
63099	f	tobechecked	\N
63100	f	tobechecked	\N
63101	f	tobechecked	\N
63102	f	tobechecked	\N
63103	f	tobechecked	\N
63104	f	tobechecked	\N
63105	f	tobechecked	\N
63106	f	tobechecked	\N
63107	f	tobechecked	\N
63108	f	tobechecked	\N
63109	f	tobechecked	\N
63110	f	tobechecked	\N
63111	f	tobechecked	\N
63112	f	tobechecked	\N
63113	f	tobechecked	\N
63114	f	tobechecked	\N
63115	f	tobechecked	\N
63116	f	tobechecked	\N
63117	f	tobechecked	\N
63118	f	tobechecked	\N
63119	f	tobechecked	\N
63120	f	tobechecked	\N
63121	f	tobechecked	\N
63122	f	tobechecked	\N
63123	f	tobechecked	\N
63124	f	tobechecked	\N
63125	f	tobechecked	\N
63126	f	tobechecked	\N
63127	f	tobechecked	\N
63128	f	tobechecked	\N
63129	f	tobechecked	\N
63130	f	tobechecked	\N
63131	f	tobechecked	\N
63132	f	tobechecked	\N
63133	f	tobechecked	\N
63134	f	tobechecked	\N
63135	f	tobechecked	\N
63136	f	tobechecked	\N
63137	f	tobechecked	\N
63138	f	tobechecked	\N
63139	f	tobechecked	\N
63140	f	tobechecked	\N
63141	f	tobechecked	\N
63142	f	tobechecked	\N
63143	f	tobechecked	\N
63144	f	tobechecked	\N
63145	f	tobechecked	\N
63146	f	tobechecked	\N
63147	f	tobechecked	\N
63148	f	tobechecked	\N
63149	f	tobechecked	\N
63151	f	tobechecked	\N
63152	t	tobechecked	\N
63153	t	tobechecked	\N
63154	t	tobechecked	\N
63155	t	tobechecked	\N
63156	t	tobechecked	\N
63157	t	tobechecked	\N
63158	t	tobechecked	\N
63159	t	tobechecked	\N
63160	t	tobechecked	\N
63161	f	tobechecked	\N
63162	f	tobechecked	\N
63163	f	tobechecked	\N
63164	t	tobechecked	\N
63166	t	tobechecked	\N
63167	t	tobechecked	\N
63168	t	tobechecked	\N
63169	t	tobechecked	\N
63170	t	tobechecked	\N
63171	t	tobechecked	\N
63172	t	tobechecked	\N
63173	t	tobechecked	\N
63174	t	tobechecked	\N
63175	t	tobechecked	\N
63176	t	tobechecked	\N
63177	t	tobechecked	\N
63178	t	tobechecked	\N
63179	t	tobechecked	\N
63180	t	tobechecked	\N
63181	t	tobechecked	\N
63182	t	tobechecked	\N
63183	t	tobechecked	\N
63184	t	tobechecked	\N
63185	t	tobechecked	\N
63186	t	tobechecked	\N
63187	t	tobechecked	\N
63188	t	tobechecked	\N
63189	t	tobechecked	\N
63190	t	tobechecked	\N
63191	t	tobechecked	\N
63192	t	tobechecked	\N
63193	t	tobechecked	\N
63194	t	tobechecked	\N
63195	f	tobechecked	\N
63196	f	tobechecked	\N
63197	f	tobechecked	\N
63198	f	tobechecked	\N
63199	f	tobechecked	\N
63200	f	tobechecked	\N
63201	f	tobechecked	\N
63202	f	tobechecked	\N
63203	f	tobechecked	\N
63204	f	tobechecked	\N
63205	f	tobechecked	\N
63206	f	tobechecked	\N
63207	f	tobechecked	\N
63208	f	tobechecked	\N
63209	f	tobechecked	\N
63210	f	tobechecked	\N
63211	f	tobechecked	\N
63212	f	tobechecked	\N
63213	f	tobechecked	\N
63214	t	tobechecked	\N
63215	t	tobechecked	\N
63216	t	tobechecked	\N
63217	t	tobechecked	\N
63218	t	tobechecked	\N
63219	t	tobechecked	\N
63220	f	tobechecked	\N
63221	f	tobechecked	\N
63222	f	tobechecked	\N
63223	f	tobechecked	\N
63224	f	tobechecked	\N
63225	f	tobechecked	\N
63226	f	tobechecked	\N
63227	f	tobechecked	\N
63228	f	tobechecked	\N
63229	f	tobechecked	\N
63230	f	tobechecked	\N
63231	f	tobechecked	\N
63232	f	tobechecked	\N
63233	f	tobechecked	\N
63234	f	tobechecked	\N
63235	f	tobechecked	\N
63236	f	tobechecked	\N
63237	f	tobechecked	\N
63238	f	tobechecked	\N
63239	f	tobechecked	\N
63246	t	tobechecked	\N
63289	t	tobechecked	\N
63308	t	tobechecked	\N
63326	t	tobechecked	\N
63339	t	tobechecked	\N
63346	t	tobechecked	\N
63358	t	tobechecked	\N
63362	t	tobechecked	\N
63363	t	tobechecked	\N
63365	t	tobechecked	\N
63434	t	tobechecked	\N
63442	t	tobechecked	\N
63445	t	tobechecked	\N
63448	f	tobechecked	\N
63456	t	tobechecked	\N
63459	t	tobechecked	\N
63464	t	tobechecked	\N
63465	t	tobechecked	\N
63480	t	tobechecked	\N
63481	t	tobechecked	\N
63482	t	tobechecked	\N
63485	t	tobechecked	\N
63494	t	tobechecked	\N
63496	t	tobechecked	\N
63498	t	tobechecked	\N
63506	t	tobechecked	\N
63572	t	tobechecked	\N
63587	f	tobechecked	\N
63588	f	tobechecked	\N
63589	f	tobechecked	\N
63590	f	tobechecked	\N
63642	t	tobechecked	\N
63663	t	tobechecked	\N
63664	t	tobechecked	\N
63665	t	tobechecked	\N
63673	t	tobechecked	\N
63675	t	tobechecked	\N
63695	t	tobechecked	\N
63696	t	tobechecked	\N
63697	t	tobechecked	\N
63698	t	tobechecked	\N
63699	t	tobechecked	\N
63700	t	tobechecked	\N
63701	t	tobechecked	\N
63702	t	tobechecked	\N
63703	t	tobechecked	\N
63704	t	tobechecked	\N
63705	t	tobechecked	\N
63706	t	tobechecked	\N
63707	t	tobechecked	\N
63708	t	tobechecked	\N
63709	t	tobechecked	\N
63713	f	tobechecked	\N
63724	f	tobechecked	\N
63736	f	tobechecked	\N
63737	f	tobechecked	\N
63738	f	tobechecked	\N
63739	f	tobechecked	\N
63740	t	tobechecked	\N
63741	t	tobechecked	\N
63742	f	tobechecked	\N
63743	t	tobechecked	\N
63744	t	tobechecked	\N
63745	t	tobechecked	\N
63746	t	tobechecked	\N
63747	t	tobechecked	\N
63748	t	tobechecked	\N
63749	f	tobechecked	\N
63750	t	tobechecked	\N
63751	t	tobechecked	\N
63752	t	tobechecked	\N
63753	t	tobechecked	\N
63754	f	tobechecked	\N
63755	t	tobechecked	\N
63756	t	tobechecked	\N
63757	t	tobechecked	\N
63758	t	tobechecked	\N
63759	t	tobechecked	\N
63760	t	tobechecked	\N
63761	f	tobechecked	\N
63762	f	tobechecked	\N
63763	f	tobechecked	\N
63764	f	tobechecked	\N
63765	f	tobechecked	\N
63766	t	tobechecked	\N
63767	t	tobechecked	\N
63768	t	tobechecked	\N
63769	t	tobechecked	\N
63774	f	tobechecked	\N
63784	t	tobechecked	\N
63785	t	tobechecked	\N
63786	t	tobechecked	\N
63787	t	tobechecked	\N
63824	t	tobechecked	\N
63828	t	tobechecked	\N
63837	t	tobechecked	\N
63839	t	tobechecked	\N
63841	t	tobechecked	\N
63842	t	tobechecked	\N
63844	t	tobechecked	\N
63848	t	tobechecked	\N
63849	t	tobechecked	\N
63874	t	tobechecked	\N
63892	t	tobechecked	\N
63893	t	tobechecked	\N
63895	t	tobechecked	\N
63902	t	tobechecked	\N
63903	t	tobechecked	\N
63904	t	tobechecked	\N
63905	t	tobechecked	\N
63906	f	tobechecked	\N
63907	t	tobechecked	\N
63908	t	tobechecked	\N
63909	t	tobechecked	\N
63910	t	tobechecked	\N
63911	t	tobechecked	\N
63912	t	tobechecked	\N
63913	t	tobechecked	\N
63914	t	tobechecked	\N
63915	t	tobechecked	\N
63916	t	tobechecked	\N
63920	t	tobechecked	\N
63921	t	tobechecked	\N
63922	t	tobechecked	\N
63923	t	tobechecked	\N
63924	t	tobechecked	\N
63925	t	tobechecked	\N
63926	t	tobechecked	\N
63927	t	tobechecked	\N
63928	t	tobechecked	\N
63929	t	tobechecked	\N
63930	t	tobechecked	\N
63931	t	tobechecked	\N
63932	t	tobechecked	\N
63933	t	tobechecked	\N
63934	t	tobechecked	\N
63935	t	tobechecked	\N
63936	t	tobechecked	\N
63937	t	tobechecked	\N
63938	t	tobechecked	\N
63939	t	tobechecked	\N
63940	t	tobechecked	\N
63941	t	tobechecked	\N
63942	t	tobechecked	\N
63943	t	tobechecked	\N
63944	t	tobechecked	\N
63945	t	tobechecked	\N
63946	t	tobechecked	\N
63947	t	tobechecked	\N
63948	t	tobechecked	\N
63949	t	tobechecked	\N
63950	t	tobechecked	\N
63951	t	tobechecked	\N
63952	t	tobechecked	\N
63953	t	tobechecked	\N
63954	t	tobechecked	\N
63955	t	tobechecked	\N
63956	t	tobechecked	\N
63957	t	tobechecked	\N
63984	t	tobechecked	\N
63987	t	tobechecked	\N
63997	t	tobechecked	\N
64006	t	tobechecked	\N
64029	t	tobechecked	\N
64036	t	tobechecked	\N
64050	f	tobechecked	\N
64055	t	tobechecked	\N
64072	t	tobechecked	\N
64073	t	tobechecked	\N
64074	t	tobechecked	\N
64075	t	tobechecked	\N
64078	f	tobechecked	\N
64109	t	tobechecked	\N
64110	t	tobechecked	\N
64111	t	tobechecked	\N
64112	t	tobechecked	\N
64113	t	tobechecked	\N
64114	t	tobechecked	\N
64115	t	tobechecked	\N
64116	t	tobechecked	\N
64117	t	tobechecked	\N
64118	t	tobechecked	\N
64119	t	tobechecked	\N
64120	t	tobechecked	\N
64121	t	tobechecked	\N
64122	t	tobechecked	\N
64123	t	tobechecked	\N
64124	t	tobechecked	\N
64125	t	tobechecked	\N
64126	t	tobechecked	\N
64127	t	tobechecked	\N
64128	t	tobechecked	\N
64129	t	tobechecked	\N
64130	t	tobechecked	\N
64131	t	tobechecked	\N
64132	t	tobechecked	\N
64133	t	tobechecked	\N
64134	t	tobechecked	\N
64135	t	tobechecked	\N
64136	t	tobechecked	\N
64137	t	tobechecked	\N
64138	t	tobechecked	\N
64139	t	tobechecked	\N
64140	t	tobechecked	\N
64141	t	tobechecked	\N
64142	t	tobechecked	\N
64143	t	tobechecked	\N
64144	t	tobechecked	\N
64145	t	tobechecked	\N
64146	t	tobechecked	\N
64147	t	tobechecked	\N
64148	t	tobechecked	\N
64149	t	tobechecked	\N
64150	t	tobechecked	\N
64151	t	tobechecked	\N
64152	t	tobechecked	\N
64153	t	tobechecked	\N
64154	t	tobechecked	\N
64155	t	tobechecked	\N
64156	t	tobechecked	\N
64157	t	tobechecked	\N
64158	t	tobechecked	\N
64159	t	tobechecked	\N
64160	t	tobechecked	\N
64161	t	tobechecked	\N
64162	t	tobechecked	\N
64163	t	tobechecked	\N
64164	t	tobechecked	\N
64165	t	tobechecked	\N
64166	t	tobechecked	\N
64167	t	tobechecked	\N
64168	t	tobechecked	\N
64169	t	tobechecked	\N
64170	t	tobechecked	\N
64171	t	tobechecked	\N
64172	t	tobechecked	\N
64173	t	tobechecked	\N
64174	t	tobechecked	\N
64175	t	tobechecked	\N
64176	t	tobechecked	\N
64177	t	tobechecked	\N
64178	t	tobechecked	\N
64179	t	tobechecked	\N
64180	t	tobechecked	\N
64181	t	tobechecked	\N
64183	t	tobechecked	\N
64184	t	tobechecked	\N
64185	t	tobechecked	\N
64186	t	tobechecked	\N
64187	t	tobechecked	\N
64188	t	tobechecked	\N
64189	t	tobechecked	\N
64190	t	tobechecked	\N
64191	t	tobechecked	\N
64192	t	tobechecked	\N
64193	t	tobechecked	\N
64194	t	tobechecked	\N
64195	t	tobechecked	\N
64196	t	tobechecked	\N
64197	t	tobechecked	\N
64198	t	tobechecked	\N
64199	t	tobechecked	\N
64200	t	tobechecked	\N
64201	t	tobechecked	\N
64202	t	tobechecked	\N
64203	t	tobechecked	\N
64204	t	tobechecked	\N
64205	t	tobechecked	\N
64206	t	tobechecked	\N
64207	t	tobechecked	\N
64208	t	tobechecked	\N
64209	t	tobechecked	\N
64210	t	tobechecked	\N
64211	t	tobechecked	\N
64212	t	tobechecked	\N
64213	t	tobechecked	\N
64214	t	tobechecked	\N
64215	t	tobechecked	\N
64216	t	tobechecked	\N
64217	t	tobechecked	\N
64218	t	tobechecked	\N
64219	t	tobechecked	\N
64220	t	tobechecked	\N
64221	t	tobechecked	\N
64222	t	tobechecked	\N
64223	t	tobechecked	\N
64224	t	tobechecked	\N
64225	t	tobechecked	\N
64226	t	tobechecked	\N
64227	t	tobechecked	\N
64228	t	tobechecked	\N
64229	t	tobechecked	\N
64230	t	tobechecked	\N
64231	t	tobechecked	\N
64232	t	tobechecked	\N
64233	t	tobechecked	\N
64234	t	tobechecked	\N
64235	t	tobechecked	\N
64236	t	tobechecked	\N
64237	t	tobechecked	\N
64238	t	tobechecked	\N
64239	t	tobechecked	\N
64240	t	tobechecked	\N
64241	t	tobechecked	\N
64242	t	tobechecked	\N
64243	t	tobechecked	\N
64244	t	tobechecked	\N
64245	t	tobechecked	\N
64246	t	tobechecked	\N
64247	t	tobechecked	\N
64248	t	tobechecked	\N
64249	t	tobechecked	\N
64250	t	tobechecked	\N
64251	t	tobechecked	\N
64252	t	tobechecked	\N
64253	t	tobechecked	\N
64254	t	tobechecked	\N
64255	t	tobechecked	\N
64256	t	tobechecked	\N
64257	t	tobechecked	\N
64258	t	tobechecked	\N
64259	t	tobechecked	\N
64260	t	tobechecked	\N
64261	t	tobechecked	\N
64262	t	tobechecked	\N
64263	t	tobechecked	\N
64264	t	tobechecked	\N
64265	t	tobechecked	\N
64266	t	tobechecked	\N
64267	t	tobechecked	\N
64268	t	tobechecked	\N
64269	t	tobechecked	\N
64270	t	tobechecked	\N
64271	t	tobechecked	\N
64272	t	tobechecked	\N
64273	t	tobechecked	\N
64274	t	tobechecked	\N
64275	t	tobechecked	\N
64276	t	tobechecked	\N
64277	t	tobechecked	\N
64278	t	tobechecked	\N
64279	t	tobechecked	\N
64280	t	tobechecked	\N
64281	t	tobechecked	\N
64282	t	tobechecked	\N
64283	t	tobechecked	\N
64284	t	tobechecked	\N
64285	t	tobechecked	\N
64286	t	tobechecked	\N
64287	t	tobechecked	\N
64288	t	tobechecked	\N
64289	t	tobechecked	\N
64290	t	tobechecked	\N
64291	t	tobechecked	\N
64292	t	tobechecked	\N
64293	t	tobechecked	\N
64294	t	tobechecked	\N
64295	t	tobechecked	\N
64296	t	tobechecked	\N
64298	f	tobechecked	\N
64299	f	tobechecked	\N
64300	f	tobechecked	\N
64301	f	tobechecked	\N
64302	f	tobechecked	\N
64303	f	tobechecked	\N
64304	f	tobechecked	\N
64305	f	tobechecked	\N
64306	f	tobechecked	\N
64307	f	tobechecked	\N
64308	f	tobechecked	\N
64309	f	tobechecked	\N
64310	f	tobechecked	\N
64311	f	tobechecked	\N
64312	f	tobechecked	\N
64313	f	tobechecked	\N
64314	f	tobechecked	\N
64315	f	tobechecked	\N
64316	f	tobechecked	\N
64317	f	tobechecked	\N
64318	f	tobechecked	\N
64319	f	tobechecked	\N
64320	f	tobechecked	\N
64321	f	tobechecked	\N
64322	f	tobechecked	\N
64323	f	tobechecked	\N
64324	f	tobechecked	\N
64325	f	tobechecked	\N
64326	f	tobechecked	\N
64327	f	tobechecked	\N
64328	f	tobechecked	\N
64329	f	tobechecked	\N
64330	f	tobechecked	\N
64331	f	tobechecked	\N
64332	f	tobechecked	\N
64333	f	tobechecked	\N
64334	f	tobechecked	\N
64335	f	tobechecked	\N
64336	f	tobechecked	\N
64337	f	tobechecked	\N
64338	f	tobechecked	\N
64339	f	tobechecked	\N
64340	f	tobechecked	\N
64341	f	tobechecked	\N
64342	f	tobechecked	\N
64343	f	tobechecked	\N
64344	f	tobechecked	\N
64345	f	tobechecked	\N
64346	f	tobechecked	\N
64347	f	tobechecked	\N
64348	f	tobechecked	\N
64349	f	tobechecked	\N
64350	f	tobechecked	\N
64351	f	tobechecked	\N
64352	f	tobechecked	\N
64353	f	tobechecked	\N
64354	f	tobechecked	\N
64355	f	tobechecked	\N
64356	f	tobechecked	\N
64357	f	tobechecked	\N
64358	f	tobechecked	\N
64359	f	tobechecked	\N
64360	f	tobechecked	\N
64361	f	tobechecked	\N
64362	f	tobechecked	\N
64363	f	tobechecked	\N
64364	f	tobechecked	\N
64365	f	tobechecked	\N
64366	f	tobechecked	\N
64367	f	tobechecked	\N
64383	t	tobechecked	\N
64384	t	tobechecked	\N
64403	t	tobechecked	\N
64405	t	tobechecked	\N
64408	t	tobechecked	\N
64433	t	tobechecked	\N
64451	t	tobechecked	\N
64453	t	tobechecked	\N
64456	t	tobechecked	\N
64460	t	tobechecked	\N
64465	f	tobechecked	\N
64490	t	tobechecked	\N
64530	f	tobechecked	\N
64537	t	tobechecked	\N
64548	t	tobechecked	\N
64556	t	tobechecked	\N
64557	t	tobechecked	\N
64563	t	tobechecked	\N
64564	t	tobechecked	\N
64569	t	tobechecked	\N
64574	t	tobechecked	\N
64589	t	tobechecked	\N
64595	t	tobechecked	\N
64596	t	tobechecked	\N
64598	t	tobechecked	\N
64600	t	tobechecked	\N
64603	t	tobechecked	\N
64604	t	tobechecked	\N
64613	t	tobechecked	\N
64614	t	tobechecked	\N
64617	f	tobechecked	\N
64618	f	tobechecked	\N
64619	f	tobechecked	\N
64620	f	tobechecked	\N
64621	f	tobechecked	\N
64622	f	tobechecked	\N
64623	f	tobechecked	\N
64624	f	tobechecked	\N
64627	t	tobechecked	\N
64628	t	tobechecked	\N
64629	t	tobechecked	\N
64630	t	tobechecked	\N
64631	t	tobechecked	\N
64632	t	tobechecked	\N
64633	f	tobechecked	\N
64652	t	tobechecked	\N
64656	t	tobechecked	\N
64661	t	tobechecked	\N
64663	t	tobechecked	\N
64664	f	tobechecked	\N
64690	t	tobechecked	\N
64708	t	tobechecked	\N
64712	t	tobechecked	\N
64749	t	tobechecked	\N
64752	t	tobechecked	\N
64758	t	tobechecked	\N
64762	t	tobechecked	\N
64769	t	tobechecked	\N
64779	t	tobechecked	\N
64800	t	tobechecked	\N
64809	f	tobechecked	\N
64811	t	tobechecked	\N
64812	t	tobechecked	\N
64815	t	tobechecked	\N
64816	t	tobechecked	\N
64818	t	tobechecked	\N
64819	t	tobechecked	\N
64827	t	tobechecked	\N
64833	t	tobechecked	\N
64839	t	tobechecked	\N
64853	t	tobechecked	\N
64860	t	tobechecked	\N
64870	t	tobechecked	\N
64871	t	tobechecked	\N
64886	f	tobechecked	\N
64902	f	tobechecked	\N
64904	f	tobechecked	\N
64909	f	tobechecked	\N
64912	f	tobechecked	\N
64913	f	tobechecked	\N
64914	f	tobechecked	\N
64915	f	tobechecked	\N
64916	f	tobechecked	\N
64917	f	tobechecked	\N
64918	f	tobechecked	\N
64919	f	tobechecked	\N
64920	f	tobechecked	\N
64921	f	tobechecked	\N
64923	f	tobechecked	\N
64924	f	tobechecked	\N
64925	f	tobechecked	\N
64926	f	tobechecked	\N
64927	t	tobechecked	\N
64928	f	tobechecked	\N
64929	t	tobechecked	\N
64930	f	tobechecked	\N
64931	t	tobechecked	\N
64932	f	tobechecked	\N
64934	t	tobechecked	\N
64935	t	tobechecked	\N
64936	t	tobechecked	\N
64944	t	tobechecked	\N
64945	t	tobechecked	\N
64946	t	tobechecked	\N
64947	t	tobechecked	\N
64948	t	tobechecked	\N
64949	t	tobechecked	\N
64973	f	tobechecked	\N
64985	t	tobechecked	\N
64989	t	tobechecked	\N
64996	t	tobechecked	\N
64998	t	tobechecked	\N
65033	t	tobechecked	\N
65045	f	tobechecked	\N
65053	t	tobechecked	\N
65059	f	tobechecked	\N
65060	f	tobechecked	\N
65065	f	tobechecked	\N
65077	f	tobechecked	\N
65086	f	tobechecked	\N
65087	f	tobechecked	\N
65088	f	tobechecked	\N
65089	f	tobechecked	\N
65090	f	tobechecked	\N
65091	f	tobechecked	\N
65092	f	tobechecked	\N
65093	t	tobechecked	\N
65095	t	tobechecked	\N
65096	t	tobechecked	\N
65135	t	tobechecked	\N
65152	t	tobechecked	\N
65166	t	tobechecked	\N
65204	f	tobechecked	\N
65241	t	tobechecked	\N
65242	t	tobechecked	\N
65243	t	tobechecked	\N
65277	f	tobechecked	\N
65280	t	tobechecked	\N
65281	t	tobechecked	\N
65282	t	tobechecked	\N
65283	t	tobechecked	\N
65284	t	tobechecked	\N
65285	t	tobechecked	\N
65286	t	tobechecked	\N
65287	t	tobechecked	\N
65288	t	tobechecked	\N
65289	t	tobechecked	\N
65290	t	tobechecked	\N
65297	t	tobechecked	\N
65330	t	tobechecked	\N
65331	f	tobechecked	\N
65341	t	tobechecked	\N
65342	t	tobechecked	\N
65346	t	tobechecked	\N
65348	t	tobechecked	\N
65349	f	tobechecked	\N
65352	f	tobechecked	\N
65360	f	tobechecked	\N
65371	f	tobechecked	\N
65372	f	tobechecked	\N
65373	f	tobechecked	\N
65374	f	tobechecked	\N
65375	f	tobechecked	\N
65394	t	tobechecked	\N
65396	t	tobechecked	\N
65397	t	tobechecked	\N
65399	t	tobechecked	\N
65400	t	tobechecked	\N
65401	t	tobechecked	\N
65402	f	tobechecked	\N
65403	t	tobechecked	\N
65404	t	tobechecked	\N
65406	f	tobechecked	\N
65407	f	tobechecked	\N
65408	f	tobechecked	\N
65409	f	tobechecked	\N
65410	f	tobechecked	\N
65411	f	tobechecked	\N
65412	f	tobechecked	\N
65413	f	tobechecked	\N
65415	f	tobechecked	\N
65417	t	tobechecked	\N
65418	f	tobechecked	\N
65419	f	tobechecked	\N
65421	t	tobechecked	\N
65422	t	tobechecked	\N
65423	t	tobechecked	\N
65424	t	tobechecked	\N
65425	t	tobechecked	\N
65426	t	tobechecked	\N
65427	t	tobechecked	\N
65428	t	tobechecked	\N
65429	t	tobechecked	\N
65430	t	tobechecked	\N
65431	t	tobechecked	\N
65432	t	tobechecked	\N
65433	t	tobechecked	\N
65434	t	tobechecked	\N
65435	t	tobechecked	\N
65436	t	tobechecked	\N
65437	t	tobechecked	\N
65438	t	tobechecked	\N
65439	t	tobechecked	\N
65440	t	tobechecked	\N
65441	t	tobechecked	\N
65442	t	tobechecked	\N
65449	t	tobechecked	\N
65457	t	tobechecked	\N
65458	t	tobechecked	\N
65463	t	tobechecked	\N
65466	t	tobechecked	\N
65467	t	tobechecked	\N
65495	t	tobechecked	\N
65496	t	tobechecked	\N
65508	t	tobechecked	\N
65515	f	tobechecked	\N
65519	t	tobechecked	\N
65526	f	tobechecked	\N
65536	t	tobechecked	\N
65539	t	tobechecked	\N
65550	t	tobechecked	\N
65573	t	tobechecked	\N
65575	f	tobechecked	\N
65579	t	tobechecked	\N
65584	t	tobechecked	\N
65600	t	tobechecked	\N
65605	f	tobechecked	\N
65610	t	tobechecked	\N
65626	t	tobechecked	\N
65627	t	tobechecked	\N
65628	t	tobechecked	\N
65639	t	tobechecked	\N
65641	t	tobechecked	\N
65647	t	tobechecked	\N
65648	t	tobechecked	\N
65669	t	tobechecked	\N
65689	f	tobechecked	\N
65699	t	tobechecked	\N
65720	t	tobechecked	\N
65726	t	tobechecked	\N
65733	t	tobechecked	\N
65747	t	tobechecked	\N
65755	t	tobechecked	\N
65784	f	tobechecked	\N
65788	t	tobechecked	\N
65794	t	tobechecked	\N
65806	t	tobechecked	\N
65807	t	tobechecked	\N
65808	t	tobechecked	\N
65809	t	tobechecked	\N
65810	t	tobechecked	\N
65811	f	tobechecked	\N
65812	t	tobechecked	\N
65813	t	tobechecked	\N
65814	f	tobechecked	\N
65815	t	tobechecked	\N
65816	f	tobechecked	\N
65817	f	tobechecked	\N
65818	f	tobechecked	\N
65819	f	tobechecked	\N
65820	f	tobechecked	\N
65821	f	tobechecked	\N
65831	f	tobechecked	\N
65834	t	tobechecked	\N
65838	f	tobechecked	\N
65839	f	tobechecked	\N
65840	t	tobechecked	\N
65841	t	tobechecked	\N
65842	t	tobechecked	\N
65845	t	tobechecked	\N
65852	t	tobechecked	\N
65853	t	tobechecked	\N
65854	t	tobechecked	\N
65857	t	tobechecked	\N
65860	t	tobechecked	\N
65886	t	tobechecked	\N
65889	t	tobechecked	\N
65913	t	tobechecked	\N
65919	t	tobechecked	\N
65925	t	tobechecked	\N
65926	t	tobechecked	\N
65927	t	tobechecked	\N
65928	t	tobechecked	\N
65929	t	tobechecked	\N
65930	t	tobechecked	\N
65931	t	tobechecked	\N
65932	t	tobechecked	\N
65933	t	tobechecked	\N
65934	t	tobechecked	\N
65935	f	tobechecked	\N
65936	t	tobechecked	\N
65937	t	tobechecked	\N
65938	f	tobechecked	\N
65939	f	tobechecked	\N
65940	f	tobechecked	\N
65941	f	tobechecked	\N
65942	f	tobechecked	\N
65943	f	tobechecked	\N
65944	f	tobechecked	\N
65945	f	tobechecked	\N
65952	f	tobechecked	\N
65954	t	tobechecked	\N
66014	t	tobechecked	\N
66015	t	tobechecked	\N
66027	t	tobechecked	\N
66028	t	tobechecked	\N
66029	t	tobechecked	\N
66030	t	tobechecked	\N
66031	t	tobechecked	\N
66032	t	tobechecked	\N
66033	t	tobechecked	\N
66034	t	tobechecked	\N
66035	t	tobechecked	\N
66036	t	tobechecked	\N
66037	t	tobechecked	\N
66038	f	tobechecked	\N
66039	t	tobechecked	\N
66040	f	tobechecked	\N
66041	t	tobechecked	\N
66042	t	tobechecked	\N
66043	t	tobechecked	\N
66044	t	tobechecked	\N
66045	t	tobechecked	\N
66046	t	tobechecked	\N
66047	t	tobechecked	\N
66048	t	tobechecked	\N
66049	t	tobechecked	\N
66050	t	tobechecked	\N
66051	t	tobechecked	\N
66052	t	tobechecked	\N
66053	t	tobechecked	\N
66054	t	tobechecked	\N
66055	t	tobechecked	\N
66056	t	tobechecked	\N
66057	t	tobechecked	\N
66058	t	tobechecked	\N
66059	t	tobechecked	\N
66060	t	tobechecked	\N
66061	t	tobechecked	\N
66062	t	tobechecked	\N
66063	t	tobechecked	\N
66064	t	tobechecked	\N
66065	t	tobechecked	\N
66066	t	tobechecked	\N
66067	t	tobechecked	\N
66068	t	tobechecked	\N
66069	t	tobechecked	\N
66070	t	tobechecked	\N
66071	t	tobechecked	\N
66072	t	tobechecked	\N
66073	t	tobechecked	\N
66074	t	tobechecked	\N
66075	t	tobechecked	\N
66076	t	tobechecked	\N
66077	t	tobechecked	\N
66078	t	tobechecked	\N
66079	t	tobechecked	\N
66080	t	tobechecked	\N
66081	t	tobechecked	\N
66082	t	tobechecked	\N
66083	f	tobechecked	\N
66084	f	tobechecked	\N
66087	f	tobechecked	\N
66088	f	tobechecked	\N
66093	f	tobechecked	\N
66100	f	tobechecked	\N
66113	f	tobechecked	\N
66128	t	tobechecked	\N
66133	t	tobechecked	\N
66137	f	tobechecked	\N
66146	f	tobechecked	\N
66151	t	tobechecked	\N
66152	t	tobechecked	\N
66153	t	tobechecked	\N
66154	t	tobechecked	\N
66155	t	tobechecked	\N
66156	t	tobechecked	\N
66157	t	tobechecked	\N
66167	f	tobechecked	\N
66194	t	tobechecked	\N
66196	t	tobechecked	\N
66209	f	tobechecked	\N
66210	t	tobechecked	\N
66211	t	tobechecked	\N
66212	t	tobechecked	\N
66213	t	tobechecked	\N
66229	t	tobechecked	\N
66239	t	tobechecked	\N
66240	t	tobechecked	\N
66242	t	tobechecked	\N
66255	t	tobechecked	\N
66271	t	tobechecked	\N
66307	t	tobechecked	\N
66311	t	tobechecked	\N
66318	t	tobechecked	\N
66319	t	tobechecked	\N
66322	t	tobechecked	\N
66323	t	tobechecked	\N
66324	t	tobechecked	\N
66325	t	tobechecked	\N
66326	t	tobechecked	\N
66327	t	tobechecked	\N
66328	t	tobechecked	\N
66329	t	tobechecked	\N
66330	t	tobechecked	\N
66331	t	tobechecked	\N
66332	t	tobechecked	\N
66333	f	tobechecked	\N
66334	t	tobechecked	\N
66335	f	tobechecked	\N
66336	f	tobechecked	\N
66337	f	tobechecked	\N
66338	t	tobechecked	\N
66339	t	tobechecked	\N
66340	f	tobechecked	\N
66341	t	tobechecked	\N
66342	t	tobechecked	\N
66343	f	tobechecked	\N
66344	f	tobechecked	\N
66345	f	tobechecked	\N
66347	t	tobechecked	\N
66363	t	tobechecked	\N
66378	t	tobechecked	\N
66379	t	tobechecked	\N
66383	f	tobechecked	\N
66384	t	tobechecked	\N
66392	t	tobechecked	\N
66400	t	tobechecked	\N
66401	t	tobechecked	\N
66402	t	tobechecked	\N
66403	t	tobechecked	\N
66404	t	tobechecked	\N
66405	t	tobechecked	\N
66406	t	tobechecked	\N
66407	t	tobechecked	\N
66408	t	tobechecked	\N
66409	t	tobechecked	\N
66410	t	tobechecked	\N
66411	t	tobechecked	\N
66412	t	tobechecked	\N
66413	t	tobechecked	\N
66414	t	tobechecked	\N
66415	t	tobechecked	\N
66416	t	tobechecked	\N
66417	t	tobechecked	\N
66418	t	tobechecked	\N
66419	t	tobechecked	\N
66420	t	tobechecked	\N
66421	t	tobechecked	\N
66422	t	tobechecked	\N
66423	t	tobechecked	\N
66424	t	tobechecked	\N
66425	t	tobechecked	\N
66426	t	tobechecked	\N
66427	t	tobechecked	\N
66428	t	tobechecked	\N
66430	t	tobechecked	\N
66431	t	tobechecked	\N
66432	t	tobechecked	\N
66433	t	tobechecked	\N
66435	t	tobechecked	\N
66437	f	tobechecked	\N
66438	t	tobechecked	\N
66440	f	tobechecked	\N
66441	f	tobechecked	\N
66443	t	tobechecked	\N
66444	t	tobechecked	\N
66445	t	tobechecked	\N
66446	t	tobechecked	\N
66469	t	tobechecked	\N
66471	t	tobechecked	\N
66472	t	tobechecked	\N
66473	t	tobechecked	\N
66474	t	tobechecked	\N
66475	t	tobechecked	\N
66480	t	tobechecked	\N
66489	t	tobechecked	\N
66493	t	tobechecked	\N
66494	t	tobechecked	\N
66518	t	tobechecked	\N
66520	t	tobechecked	\N
66534	t	tobechecked	\N
66535	f	tobechecked	\N
66536	f	tobechecked	\N
66538	f	tobechecked	\N
66540	f	tobechecked	\N
66550	f	tobechecked	\N
66551	f	tobechecked	\N
66552	t	tobechecked	\N
66562	f	tobechecked	\N
66567	f	tobechecked	\N
66569	f	tobechecked	\N
66570	f	tobechecked	\N
66571	f	tobechecked	\N
66572	t	tobechecked	\N
66573	t	tobechecked	\N
66574	t	tobechecked	\N
66575	t	tobechecked	\N
66576	t	tobechecked	\N
66577	t	tobechecked	\N
66578	f	tobechecked	\N
66579	f	tobechecked	\N
66580	f	tobechecked	\N
66581	f	tobechecked	\N
66582	f	tobechecked	\N
66583	t	tobechecked	\N
66584	t	tobechecked	\N
66585	t	tobechecked	\N
66586	t	tobechecked	\N
66587	t	tobechecked	\N
66588	t	tobechecked	\N
66589	t	tobechecked	\N
66590	t	tobechecked	\N
66591	t	tobechecked	\N
66592	t	tobechecked	\N
66593	t	tobechecked	\N
66594	t	tobechecked	\N
66595	f	tobechecked	\N
66596	t	tobechecked	\N
66597	f	tobechecked	\N
66598	t	tobechecked	\N
66599	t	tobechecked	\N
66600	f	tobechecked	\N
66601	f	tobechecked	\N
66602	t	tobechecked	\N
66603	t	tobechecked	\N
66604	t	tobechecked	\N
66605	t	tobechecked	\N
66608	t	tobechecked	\N
66611	f	tobechecked	\N
66612	t	tobechecked	\N
66613	t	tobechecked	\N
66615	f	tobechecked	\N
66617	f	tobechecked	\N
66631	f	tobechecked	\N
66635	f	tobechecked	\N
66640	t	tobechecked	\N
66641	t	tobechecked	\N
66642	t	tobechecked	\N
66643	t	tobechecked	\N
66644	f	tobechecked	\N
66645	f	tobechecked	\N
66646	f	tobechecked	\N
66647	f	tobechecked	\N
66648	f	tobechecked	\N
66649	f	tobechecked	\N
66650	f	tobechecked	\N
66651	f	tobechecked	\N
66652	f	tobechecked	\N
66653	f	tobechecked	\N
66654	f	tobechecked	\N
66655	t	tobechecked	\N
66656	t	tobechecked	\N
66657	t	tobechecked	\N
66658	t	tobechecked	\N
66659	t	tobechecked	\N
66660	t	tobechecked	\N
66661	t	tobechecked	\N
66662	t	tobechecked	\N
66663	t	tobechecked	\N
66664	t	tobechecked	\N
66665	t	tobechecked	\N
66666	t	tobechecked	\N
66667	t	tobechecked	\N
66668	t	tobechecked	\N
66669	t	tobechecked	\N
66671	t	tobechecked	\N
66708	f	tobechecked	\N
66711	t	tobechecked	\N
66712	t	tobechecked	\N
66713	t	tobechecked	\N
66714	t	tobechecked	\N
66715	f	tobechecked	\N
66716	f	tobechecked	\N
66717	t	tobechecked	\N
66718	t	tobechecked	\N
66719	t	tobechecked	\N
66720	t	tobechecked	\N
66721	t	tobechecked	\N
66722	f	tobechecked	\N
66723	t	tobechecked	\N
66724	t	tobechecked	\N
66725	t	tobechecked	\N
66726	t	tobechecked	\N
66727	t	tobechecked	\N
66728	t	tobechecked	\N
66729	f	tobechecked	\N
66730	f	tobechecked	\N
66731	t	tobechecked	\N
66732	t	tobechecked	\N
66733	t	tobechecked	\N
66734	t	tobechecked	\N
66735	f	tobechecked	\N
66736	f	tobechecked	\N
66737	t	tobechecked	\N
66738	f	tobechecked	\N
66739	f	tobechecked	\N
66741	f	tobechecked	\N
66742	f	tobechecked	\N
66743	f	tobechecked	\N
66744	f	tobechecked	\N
66745	f	tobechecked	\N
66746	f	tobechecked	\N
66747	f	tobechecked	\N
66748	f	tobechecked	\N
66749	f	tobechecked	\N
66750	f	tobechecked	\N
66751	f	tobechecked	\N
66752	f	tobechecked	\N
66753	f	tobechecked	\N
66754	f	tobechecked	\N
66755	f	tobechecked	\N
66756	f	tobechecked	\N
66757	f	tobechecked	\N
66758	f	tobechecked	\N
66759	f	tobechecked	\N
66760	f	tobechecked	\N
66761	f	tobechecked	\N
66762	f	tobechecked	\N
66763	f	tobechecked	\N
66764	f	tobechecked	\N
66765	f	tobechecked	\N
66766	f	tobechecked	\N
66767	f	tobechecked	\N
66768	f	tobechecked	\N
66769	f	tobechecked	\N
66770	f	tobechecked	\N
66771	f	tobechecked	\N
66772	f	tobechecked	\N
66774	t	tobechecked	\N
66784	f	tobechecked	\N
66786	f	tobechecked	\N
66787	f	tobechecked	\N
66801	t	tobechecked	\N
66804	t	tobechecked	\N
66808	t	tobechecked	\N
66809	f	tobechecked	\N
66810	f	tobechecked	\N
66811	f	tobechecked	\N
66812	f	tobechecked	\N
66813	f	tobechecked	\N
66814	f	tobechecked	\N
66815	f	tobechecked	\N
66816	f	tobechecked	\N
66817	f	tobechecked	\N
66818	f	tobechecked	\N
66819	f	tobechecked	\N
66820	f	tobechecked	\N
66821	t	tobechecked	\N
66822	t	tobechecked	\N
66825	t	tobechecked	\N
66826	t	tobechecked	\N
66833	f	tobechecked	\N
66834	f	tobechecked	\N
66859	t	tobechecked	\N
66860	t	tobechecked	\N
66861	t	tobechecked	\N
66862	t	tobechecked	\N
66863	t	tobechecked	\N
66864	t	tobechecked	\N
66865	t	tobechecked	\N
66869	t	tobechecked	\N
66870	t	tobechecked	\N
66873	t	tobechecked	\N
66881	t	tobechecked	\N
66885	t	tobechecked	\N
66886	t	tobechecked	\N
66898	t	tobechecked	\N
66899	t	tobechecked	\N
66900	t	tobechecked	\N
66901	t	tobechecked	\N
66902	t	tobechecked	\N
66903	t	tobechecked	\N
66904	t	tobechecked	\N
66905	t	tobechecked	\N
66906	t	tobechecked	\N
66907	t	tobechecked	\N
66908	t	tobechecked	\N
66909	t	tobechecked	\N
66910	t	tobechecked	\N
66911	t	tobechecked	\N
66912	t	tobechecked	\N
66913	t	tobechecked	\N
66914	t	tobechecked	\N
66915	t	tobechecked	\N
66916	t	tobechecked	\N
66917	t	tobechecked	\N
66918	t	tobechecked	\N
66919	t	tobechecked	\N
66920	t	tobechecked	\N
66921	t	tobechecked	\N
66922	t	tobechecked	\N
66923	t	tobechecked	\N
66924	t	tobechecked	\N
66925	t	tobechecked	\N
66926	t	tobechecked	\N
66927	t	tobechecked	\N
66928	t	tobechecked	\N
66929	t	tobechecked	\N
66930	t	tobechecked	\N
66931	t	tobechecked	\N
66932	f	tobechecked	\N
66933	t	tobechecked	\N
66934	t	tobechecked	\N
66935	t	tobechecked	\N
66936	t	tobechecked	\N
66937	t	tobechecked	\N
66938	t	tobechecked	\N
66939	f	tobechecked	\N
66943	f	tobechecked	\N
66944	f	tobechecked	\N
66945	f	tobechecked	\N
66946	f	tobechecked	\N
66947	f	tobechecked	\N
66948	f	tobechecked	\N
66949	f	tobechecked	\N
66950	f	tobechecked	\N
66951	f	tobechecked	\N
66952	f	tobechecked	\N
66953	f	tobechecked	\N
66954	f	tobechecked	\N
66955	f	tobechecked	\N
66956	f	tobechecked	\N
66957	f	tobechecked	\N
66958	f	tobechecked	\N
66959	f	tobechecked	\N
66960	f	tobechecked	\N
66961	f	tobechecked	\N
66962	f	tobechecked	\N
66963	f	tobechecked	\N
66964	f	tobechecked	\N
66965	f	tobechecked	\N
66966	f	tobechecked	\N
66967	f	tobechecked	\N
66968	f	tobechecked	\N
66993	f	tobechecked	\N
66994	f	tobechecked	\N
66995	f	tobechecked	\N
67015	f	tobechecked	\N
67036	t	tobechecked	\N
67037	t	tobechecked	\N
67051	f	tobechecked	\N
67053	f	tobechecked	\N
67054	f	tobechecked	\N
67055	f	tobechecked	\N
67070	f	tobechecked	\N
67071	f	tobechecked	\N
67072	f	tobechecked	\N
67073	f	tobechecked	\N
67074	f	tobechecked	\N
67075	f	tobechecked	\N
67076	f	tobechecked	\N
67077	f	tobechecked	\N
67078	f	tobechecked	\N
67079	f	tobechecked	\N
67086	t	tobechecked	\N
67089	f	tobechecked	\N
67092	t	tobechecked	\N
67095	t	tobechecked	\N
67096	t	tobechecked	\N
67101	t	tobechecked	\N
67103	t	tobechecked	\N
67104	t	tobechecked	\N
67105	t	tobechecked	\N
67106	t	tobechecked	\N
67107	t	tobechecked	\N
67108	t	tobechecked	\N
67109	t	tobechecked	\N
67110	t	tobechecked	\N
67111	t	tobechecked	\N
67112	t	tobechecked	\N
67113	t	tobechecked	\N
67114	t	tobechecked	\N
67115	t	tobechecked	\N
67116	t	tobechecked	\N
67117	t	tobechecked	\N
67118	t	tobechecked	\N
67119	t	tobechecked	\N
67120	t	tobechecked	\N
67121	t	tobechecked	\N
67122	t	tobechecked	\N
67123	t	tobechecked	\N
67124	t	tobechecked	\N
67125	t	tobechecked	\N
67126	t	tobechecked	\N
67127	t	tobechecked	\N
67128	t	tobechecked	\N
67129	t	tobechecked	\N
67130	t	tobechecked	\N
67131	t	tobechecked	\N
67132	t	tobechecked	\N
67133	t	tobechecked	\N
67134	t	tobechecked	\N
67135	t	tobechecked	\N
67136	t	tobechecked	\N
67137	t	tobechecked	\N
67138	t	tobechecked	\N
67139	t	tobechecked	\N
67140	t	tobechecked	\N
67141	t	tobechecked	\N
67142	t	tobechecked	\N
67143	t	tobechecked	\N
67149	t	tobechecked	\N
67150	f	tobechecked	\N
67151	t	tobechecked	\N
67152	t	tobechecked	\N
67153	t	tobechecked	\N
67154	t	tobechecked	\N
67155	t	tobechecked	\N
67156	t	tobechecked	\N
67157	t	tobechecked	\N
67158	t	tobechecked	\N
67159	t	tobechecked	\N
67160	t	tobechecked	\N
67161	t	tobechecked	\N
67162	t	tobechecked	\N
67163	t	tobechecked	\N
67164	t	tobechecked	\N
67165	t	tobechecked	\N
67166	t	tobechecked	\N
67167	t	tobechecked	\N
67168	t	tobechecked	\N
67169	t	tobechecked	\N
67170	t	tobechecked	\N
67171	t	tobechecked	\N
67172	t	tobechecked	\N
67173	t	tobechecked	\N
67174	t	tobechecked	\N
67175	t	tobechecked	\N
67176	t	tobechecked	\N
67177	t	tobechecked	\N
67178	t	tobechecked	\N
67179	t	tobechecked	\N
67180	t	tobechecked	\N
67181	t	tobechecked	\N
67182	t	tobechecked	\N
67209	t	tobechecked	\N
67215	t	tobechecked	\N
67227	f	tobechecked	\N
67228	f	tobechecked	\N
67229	f	tobechecked	\N
67230	f	tobechecked	\N
67231	f	tobechecked	\N
67232	f	tobechecked	\N
67233	f	tobechecked	\N
67234	f	tobechecked	\N
67235	f	tobechecked	\N
67236	f	tobechecked	\N
67237	f	tobechecked	\N
67238	t	tobechecked	\N
67239	f	tobechecked	\N
67249	f	tobechecked	\N
67258	f	tobechecked	\N
67266	f	tobechecked	\N
67273	f	tobechecked	\N
67274	f	tobechecked	\N
67275	f	tobechecked	\N
67285	f	tobechecked	\N
67291	t	tobechecked	\N
67293	t	tobechecked	\N
67294	t	tobechecked	\N
67295	f	tobechecked	\N
67296	t	tobechecked	\N
67297	t	tobechecked	\N
67298	t	tobechecked	\N
67299	t	tobechecked	\N
67300	t	tobechecked	\N
67301	t	tobechecked	\N
67302	t	tobechecked	\N
67303	t	tobechecked	\N
67304	t	tobechecked	\N
67305	t	tobechecked	\N
67306	f	tobechecked	\N
67307	t	tobechecked	\N
67308	t	tobechecked	\N
67309	t	tobechecked	\N
67310	t	tobechecked	\N
67311	t	tobechecked	\N
67312	t	tobechecked	\N
67313	t	tobechecked	\N
67314	t	tobechecked	\N
67315	t	tobechecked	\N
67316	t	tobechecked	\N
67317	t	tobechecked	\N
67322	t	tobechecked	\N
67325	t	tobechecked	\N
67329	f	tobechecked	\N
67330	f	tobechecked	\N
67331	f	tobechecked	\N
67332	f	tobechecked	\N
67333	f	tobechecked	\N
67334	f	tobechecked	\N
67335	f	tobechecked	\N
67336	f	tobechecked	\N
67337	f	tobechecked	\N
67338	f	tobechecked	\N
67339	t	tobechecked	\N
67340	t	tobechecked	\N
67341	t	tobechecked	\N
67342	t	tobechecked	\N
67343	t	tobechecked	\N
67344	t	tobechecked	\N
67345	t	tobechecked	\N
67346	t	tobechecked	\N
67347	t	tobechecked	\N
67348	t	tobechecked	\N
67349	t	tobechecked	\N
67350	t	tobechecked	\N
67351	t	tobechecked	\N
67352	t	tobechecked	\N
67353	t	tobechecked	\N
67354	t	tobechecked	\N
67355	t	tobechecked	\N
67356	t	tobechecked	\N
67357	t	tobechecked	\N
67358	t	tobechecked	\N
67359	t	tobechecked	\N
67360	t	tobechecked	\N
67361	t	tobechecked	\N
67362	t	tobechecked	\N
67363	t	tobechecked	\N
67364	t	tobechecked	\N
67365	t	tobechecked	\N
67366	t	tobechecked	\N
67367	t	tobechecked	\N
67368	t	tobechecked	\N
67369	t	tobechecked	\N
67370	t	tobechecked	\N
67371	t	tobechecked	\N
67372	t	tobechecked	\N
67373	t	tobechecked	\N
67374	t	tobechecked	\N
67375	t	tobechecked	\N
67376	t	tobechecked	\N
67377	t	tobechecked	\N
67378	t	tobechecked	\N
67379	t	tobechecked	\N
67380	t	tobechecked	\N
67381	t	tobechecked	\N
67382	t	tobechecked	\N
67383	t	tobechecked	\N
67384	t	tobechecked	\N
67385	t	tobechecked	\N
67386	t	tobechecked	\N
67387	t	tobechecked	\N
67388	t	tobechecked	\N
67389	t	tobechecked	\N
67390	t	tobechecked	\N
67391	t	tobechecked	\N
67392	t	tobechecked	\N
67393	t	tobechecked	\N
67394	t	tobechecked	\N
67395	t	tobechecked	\N
67396	t	tobechecked	\N
67397	t	tobechecked	\N
67398	t	tobechecked	\N
67399	t	tobechecked	\N
67400	t	tobechecked	\N
67401	t	tobechecked	\N
67402	t	tobechecked	\N
67403	t	tobechecked	\N
67404	t	tobechecked	\N
67405	t	tobechecked	\N
67406	t	tobechecked	\N
67407	t	tobechecked	\N
67408	t	tobechecked	\N
67409	t	tobechecked	\N
67410	t	tobechecked	\N
67411	t	tobechecked	\N
67412	t	tobechecked	\N
67413	t	tobechecked	\N
67414	t	tobechecked	\N
67415	t	tobechecked	\N
67416	t	tobechecked	\N
67417	t	tobechecked	\N
67418	t	tobechecked	\N
67419	t	tobechecked	\N
67420	t	tobechecked	\N
67421	t	tobechecked	\N
67422	t	tobechecked	\N
67423	t	tobechecked	\N
67424	t	tobechecked	\N
67425	t	tobechecked	\N
67426	t	tobechecked	\N
67427	t	tobechecked	\N
67428	t	tobechecked	\N
67429	t	tobechecked	\N
67430	t	tobechecked	\N
67431	t	tobechecked	\N
67432	t	tobechecked	\N
67433	t	tobechecked	\N
67434	t	tobechecked	\N
67435	t	tobechecked	\N
67436	t	tobechecked	\N
67437	t	tobechecked	\N
67438	t	tobechecked	\N
67439	t	tobechecked	\N
67440	t	tobechecked	\N
67441	t	tobechecked	\N
67442	t	tobechecked	\N
67443	t	tobechecked	\N
67444	t	tobechecked	\N
67445	t	tobechecked	\N
67446	t	tobechecked	\N
67447	t	tobechecked	\N
67448	t	tobechecked	\N
67449	t	tobechecked	\N
67450	t	tobechecked	\N
67451	t	tobechecked	\N
67452	t	tobechecked	\N
67453	t	tobechecked	\N
67454	t	tobechecked	\N
67455	t	tobechecked	\N
67456	t	tobechecked	\N
67457	t	tobechecked	\N
67458	t	tobechecked	\N
67459	t	tobechecked	\N
67460	t	tobechecked	\N
67461	t	tobechecked	\N
67462	t	tobechecked	\N
67463	t	tobechecked	\N
67464	t	tobechecked	\N
67465	t	tobechecked	\N
67466	f	tobechecked	\N
67467	f	tobechecked	\N
67468	f	tobechecked	\N
67469	t	tobechecked	\N
67470	t	tobechecked	\N
67471	t	tobechecked	\N
67472	t	tobechecked	\N
67473	t	tobechecked	\N
67474	t	tobechecked	\N
67475	t	tobechecked	\N
67476	t	tobechecked	\N
67477	t	tobechecked	\N
67478	t	tobechecked	\N
67479	t	tobechecked	\N
67480	t	tobechecked	\N
67481	t	tobechecked	\N
67482	t	tobechecked	\N
67483	t	tobechecked	\N
67484	t	tobechecked	\N
67485	f	tobechecked	\N
67486	t	tobechecked	\N
67487	t	tobechecked	\N
67488	t	tobechecked	\N
67489	t	tobechecked	\N
67490	t	tobechecked	\N
67504	f	tobechecked	\N
67511	f	tobechecked	\N
67512	f	tobechecked	\N
67513	f	tobechecked	\N
67514	f	tobechecked	\N
67515	f	tobechecked	\N
67516	f	tobechecked	\N
67517	f	tobechecked	\N
67518	f	tobechecked	\N
67519	f	tobechecked	\N
67520	t	tobechecked	\N
67528	t	tobechecked	\N
67530	f	tobechecked	\N
67540	t	tobechecked	\N
67543	t	tobechecked	\N
67545	f	tobechecked	\N
67552	t	tobechecked	\N
67563	f	tobechecked	\N
67568	f	tobechecked	\N
67569	t	tobechecked	\N
67570	t	tobechecked	\N
67571	t	tobechecked	\N
67572	t	tobechecked	\N
67573	t	tobechecked	\N
67574	t	tobechecked	\N
67575	t	tobechecked	\N
67576	t	tobechecked	\N
67577	f	tobechecked	2027-02-23 00:00:00
67578	t	tobechecked	\N
67579	t	tobechecked	\N
67580	t	tobechecked	\N
67581	t	tobechecked	\N
67582	t	tobechecked	\N
67583	t	tobechecked	\N
67584	t	tobechecked	\N
67587	t	tobechecked	\N
67610	t	tobechecked	\N
67623	t	tobechecked	\N
67653	t	tobechecked	\N
67657	t	tobechecked	\N
67674	t	tobechecked	\N
67675	t	tobechecked	\N
67678	t	tobechecked	\N
67687	t	tobechecked	\N
67703	t	tobechecked	\N
67708	t	tobechecked	\N
67744	t	tobechecked	\N
67767	f	tobechecked	\N
67768	f	tobechecked	\N
67769	f	tobechecked	\N
67770	f	tobechecked	\N
67771	f	tobechecked	\N
67772	f	tobechecked	\N
67773	f	tobechecked	\N
67774	f	tobechecked	\N
67789	t	tobechecked	\N
67801	t	tobechecked	\N
67802	t	tobechecked	\N
67803	t	tobechecked	\N
67807	t	tobechecked	\N
67808	t	tobechecked	\N
67809	t	tobechecked	\N
67810	t	tobechecked	\N
67816	t	tobechecked	\N
67819	f	tobechecked	\N
67820	f	tobechecked	\N
67830	f	tobechecked	\N
67833	t	tobechecked	\N
67834	f	tobechecked	\N
67836	t	tobechecked	\N
67841	t	tobechecked	\N
67842	t	tobechecked	\N
67843	t	tobechecked	\N
67844	t	tobechecked	\N
67845	t	tobechecked	\N
67846	t	tobechecked	\N
67847	t	tobechecked	\N
67848	t	tobechecked	\N
67849	t	tobechecked	\N
67850	t	tobechecked	\N
67851	t	tobechecked	\N
67852	t	tobechecked	\N
67853	t	tobechecked	\N
67854	t	tobechecked	\N
67855	t	tobechecked	\N
67856	t	tobechecked	\N
67857	t	tobechecked	\N
67858	t	tobechecked	\N
67859	t	tobechecked	\N
67861	t	tobechecked	\N
67862	t	tobechecked	\N
67866	f	tobechecked	\N
67868	f	tobechecked	\N
67871	f	tobechecked	\N
67872	t	tobechecked	\N
67877	t	tobechecked	\N
67878	t	tobechecked	\N
67879	t	tobechecked	\N
67888	f	tobechecked	\N
67889	f	tobechecked	\N
67891	f	tobechecked	\N
67892	f	tobechecked	\N
67900	t	tobechecked	\N
67901	t	tobechecked	\N
67902	t	tobechecked	\N
67903	t	tobechecked	\N
67904	t	tobechecked	\N
67905	t	tobechecked	\N
67906	t	tobechecked	\N
67964	t	tobechecked	\N
67973	f	tobechecked	\N
67985	t	tobechecked	\N
67990	f	tobechecked	\N
67996	f	tobechecked	\N
68003	f	tobechecked	\N
68010	f	tobechecked	\N
68012	f	tobechecked	\N
68014	f	tobechecked	\N
68016	f	tobechecked	\N
68023	f	tobechecked	\N
68024	t	tobechecked	\N
68085	t	tobechecked	\N
68088	t	tobechecked	\N
68089	t	tobechecked	\N
68090	t	tobechecked	\N
68097	f	tobechecked	\N
68098	t	tobechecked	\N
68104	t	tobechecked	\N
68107	t	tobechecked	\N
68129	t	tobechecked	\N
68137	t	tobechecked	\N
68139	t	tobechecked	\N
68144	f	tobechecked	\N
68145	f	tobechecked	\N
68146	f	tobechecked	\N
68147	f	tobechecked	\N
68148	f	tobechecked	\N
68149	f	tobechecked	\N
68150	f	tobechecked	\N
68151	f	tobechecked	\N
68152	f	tobechecked	\N
68153	f	tobechecked	\N
68154	f	tobechecked	\N
68155	f	tobechecked	\N
68156	f	tobechecked	\N
68157	f	tobechecked	\N
68158	f	tobechecked	\N
68159	f	tobechecked	\N
68160	f	tobechecked	\N
68161	f	tobechecked	\N
68162	f	tobechecked	\N
68163	f	tobechecked	\N
68164	f	tobechecked	\N
68165	f	tobechecked	\N
68166	f	tobechecked	\N
68167	f	tobechecked	\N
68168	f	tobechecked	\N
68169	f	tobechecked	\N
68170	f	tobechecked	\N
68176	f	tobechecked	\N
68177	f	tobechecked	\N
68178	f	tobechecked	\N
68179	f	tobechecked	\N
68180	f	tobechecked	\N
68181	f	tobechecked	\N
68182	f	tobechecked	\N
68183	f	tobechecked	\N
68184	f	tobechecked	\N
68185	f	tobechecked	\N
68186	f	tobechecked	\N
68187	f	tobechecked	\N
68188	f	tobechecked	\N
68189	f	tobechecked	\N
68190	f	tobechecked	\N
68191	f	tobechecked	\N
68192	f	tobechecked	\N
68193	f	tobechecked	\N
68194	f	tobechecked	\N
68195	f	tobechecked	\N
68196	f	tobechecked	\N
68205	t	tobechecked	\N
68206	t	tobechecked	\N
68209	t	tobechecked	\N
68212	t	tobechecked	\N
68213	t	tobechecked	\N
68218	t	tobechecked	\N
68219	t	tobechecked	\N
68222	t	tobechecked	\N
68225	t	tobechecked	\N
68227	t	tobechecked	\N
68228	t	tobechecked	\N
68231	t	tobechecked	\N
68233	t	tobechecked	\N
68236	t	tobechecked	\N
68244	t	tobechecked	\N
68245	t	tobechecked	\N
68246	t	tobechecked	\N
68247	f	tobechecked	\N
68248	f	tobechecked	\N
68249	f	tobechecked	\N
68254	t	tobechecked	\N
68255	t	tobechecked	\N
68256	t	tobechecked	\N
68257	t	tobechecked	\N
68258	t	tobechecked	\N
68259	t	tobechecked	\N
68260	t	tobechecked	\N
68261	t	tobechecked	\N
68262	t	tobechecked	\N
68263	t	tobechecked	\N
68264	t	tobechecked	\N
68265	t	tobechecked	\N
68266	t	tobechecked	\N
68267	t	tobechecked	\N
68268	t	tobechecked	\N
68269	t	tobechecked	\N
68270	f	tobechecked	\N
68271	t	tobechecked	\N
68272	t	tobechecked	\N
68273	t	tobechecked	\N
68274	t	tobechecked	\N
68275	t	tobechecked	\N
68276	t	tobechecked	\N
68277	t	tobechecked	\N
68278	t	tobechecked	\N
68279	t	tobechecked	\N
68280	t	tobechecked	\N
68281	t	tobechecked	\N
68282	t	tobechecked	\N
68283	t	tobechecked	\N
68284	t	tobechecked	\N
68285	t	tobechecked	\N
68286	t	tobechecked	\N
68287	t	tobechecked	\N
68288	t	tobechecked	\N
68289	t	tobechecked	\N
68290	t	tobechecked	\N
68291	t	tobechecked	\N
68292	t	tobechecked	\N
68293	t	tobechecked	\N
68294	t	tobechecked	\N
68295	t	tobechecked	\N
68296	t	tobechecked	\N
68297	t	tobechecked	\N
68298	t	tobechecked	\N
68299	t	tobechecked	\N
68300	t	tobechecked	\N
68301	t	tobechecked	\N
68302	t	tobechecked	\N
68303	t	tobechecked	\N
68304	t	tobechecked	\N
68305	t	tobechecked	\N
68306	t	tobechecked	\N
68307	t	tobechecked	\N
68308	t	tobechecked	\N
68309	t	tobechecked	\N
68310	t	tobechecked	\N
68311	t	tobechecked	\N
68312	t	tobechecked	\N
68313	t	tobechecked	\N
68314	t	tobechecked	\N
68315	t	tobechecked	\N
68316	t	tobechecked	\N
68317	t	tobechecked	\N
68318	t	tobechecked	\N
68319	t	tobechecked	\N
68320	t	tobechecked	\N
68321	t	tobechecked	\N
68322	t	tobechecked	\N
68323	t	tobechecked	\N
68324	t	tobechecked	\N
68325	t	tobechecked	\N
68326	t	tobechecked	\N
68327	t	tobechecked	\N
68328	t	tobechecked	\N
68329	t	tobechecked	\N
68330	t	tobechecked	\N
68331	t	tobechecked	\N
68332	t	tobechecked	\N
68333	t	tobechecked	\N
68334	t	tobechecked	\N
68335	t	tobechecked	\N
68336	t	tobechecked	\N
68337	t	tobechecked	\N
68338	t	tobechecked	\N
68339	t	tobechecked	\N
68340	t	tobechecked	\N
68341	t	tobechecked	\N
68342	t	tobechecked	\N
68343	t	tobechecked	\N
68344	t	tobechecked	\N
68345	t	tobechecked	\N
68346	t	tobechecked	\N
68347	t	tobechecked	\N
68348	t	tobechecked	\N
68349	t	tobechecked	\N
68350	t	tobechecked	\N
68351	t	tobechecked	\N
68352	t	tobechecked	\N
68353	t	tobechecked	\N
68354	t	tobechecked	\N
68355	t	tobechecked	\N
68356	t	tobechecked	\N
68357	t	tobechecked	\N
68358	t	tobechecked	\N
68359	t	tobechecked	\N
68360	t	tobechecked	\N
68361	t	tobechecked	\N
68362	t	tobechecked	\N
68363	t	tobechecked	\N
68364	t	tobechecked	\N
68365	t	tobechecked	\N
68366	t	tobechecked	\N
68367	t	tobechecked	\N
68368	t	tobechecked	\N
68369	t	tobechecked	\N
68370	t	tobechecked	\N
68371	t	tobechecked	\N
68372	f	tobechecked	\N
68373	f	tobechecked	\N
68377	f	tobechecked	\N
68378	f	tobechecked	\N
68379	f	tobechecked	2038-12-31 00:00:00
68380	f	tobechecked	2038-12-31 00:00:00
68387	t	tobechecked	\N
68392	t	tobechecked	\N
68398	t	tobechecked	\N
68404	t	tobechecked	\N
68405	t	tobechecked	\N
68451	t	tobechecked	\N
68452	t	tobechecked	\N
68453	t	tobechecked	\N
68454	t	tobechecked	\N
68455	t	tobechecked	\N
68456	t	tobechecked	\N
68457	t	tobechecked	\N
68458	t	tobechecked	\N
68459	t	tobechecked	\N
68460	t	tobechecked	\N
68461	t	tobechecked	\N
68462	t	tobechecked	\N
68463	t	tobechecked	\N
68465	t	tobechecked	\N
68475	t	tobechecked	\N
68476	t	tobechecked	\N
68477	t	tobechecked	\N
68478	t	tobechecked	\N
68479	t	tobechecked	\N
68480	t	tobechecked	\N
68481	t	tobechecked	\N
68482	t	tobechecked	\N
68483	t	tobechecked	\N
68484	t	tobechecked	\N
68485	t	tobechecked	\N
68486	t	tobechecked	\N
68487	t	tobechecked	\N
68488	t	tobechecked	\N
68489	f	tobechecked	\N
68490	t	tobechecked	\N
68491	t	tobechecked	\N
68492	t	tobechecked	\N
68493	t	tobechecked	\N
68494	t	tobechecked	\N
68495	t	tobechecked	\N
68496	t	tobechecked	\N
68497	t	tobechecked	\N
68498	t	tobechecked	\N
68499	t	tobechecked	\N
68500	t	tobechecked	\N
68501	t	tobechecked	\N
68502	t	tobechecked	\N
68503	t	tobechecked	\N
68504	t	tobechecked	\N
68505	t	tobechecked	\N
68506	t	tobechecked	\N
68507	t	tobechecked	\N
68508	t	tobechecked	\N
68509	t	tobechecked	\N
68510	t	tobechecked	\N
68511	t	tobechecked	\N
68512	t	tobechecked	\N
68513	t	tobechecked	\N
68514	t	tobechecked	\N
68515	t	tobechecked	\N
68516	t	tobechecked	\N
68517	t	tobechecked	\N
68541	f	tobechecked	\N
68544	f	tobechecked	\N
68559	f	tobechecked	\N
68560	t	tobechecked	\N
68583	t	tobechecked	\N
68584	t	tobechecked	\N
68585	t	tobechecked	\N
68586	t	tobechecked	\N
68587	t	tobechecked	\N
68588	t	tobechecked	\N
68589	t	tobechecked	\N
68590	t	tobechecked	\N
68591	t	tobechecked	\N
68592	t	tobechecked	\N
68593	t	tobechecked	\N
68594	t	tobechecked	\N
68595	t	tobechecked	\N
68596	t	tobechecked	\N
68597	t	tobechecked	\N
68598	t	tobechecked	\N
68599	t	tobechecked	\N
68602	t	tobechecked	\N
68603	t	tobechecked	\N
68604	t	tobechecked	\N
68608	f	tobechecked	\N
68612	t	tobechecked	\N
68613	t	tobechecked	\N
68614	t	tobechecked	\N
68615	t	tobechecked	\N
68616	t	tobechecked	\N
68617	t	tobechecked	\N
68618	t	tobechecked	\N
68619	t	tobechecked	\N
68620	t	tobechecked	\N
68657	t	tobechecked	\N
68658	t	tobechecked	\N
68659	t	tobechecked	\N
68660	t	tobechecked	\N
68661	t	tobechecked	\N
68662	t	tobechecked	\N
68663	t	tobechecked	\N
68664	t	tobechecked	\N
68665	t	tobechecked	\N
68666	t	tobechecked	\N
68667	t	tobechecked	\N
68668	t	tobechecked	\N
68669	t	tobechecked	\N
68670	t	tobechecked	\N
68671	t	tobechecked	\N
68672	t	tobechecked	\N
68673	t	tobechecked	\N
68674	t	tobechecked	\N
68675	t	tobechecked	\N
68676	t	tobechecked	\N
68677	t	tobechecked	\N
68678	t	tobechecked	\N
68679	t	tobechecked	\N
68680	t	tobechecked	\N
68681	t	tobechecked	\N
68682	t	tobechecked	\N
68683	t	tobechecked	\N
68684	t	tobechecked	\N
68685	t	tobechecked	\N
68686	t	tobechecked	\N
68687	t	tobechecked	\N
68688	t	tobechecked	\N
68689	t	tobechecked	\N
68690	t	tobechecked	\N
68691	t	tobechecked	\N
68692	t	tobechecked	\N
68693	t	tobechecked	\N
68694	t	tobechecked	\N
68695	t	tobechecked	\N
68696	t	tobechecked	\N
68697	t	tobechecked	\N
68698	t	tobechecked	\N
68699	t	tobechecked	\N
68700	t	tobechecked	\N
68701	t	tobechecked	\N
68702	t	tobechecked	\N
68703	t	tobechecked	\N
68704	t	tobechecked	\N
68705	t	tobechecked	\N
68706	t	tobechecked	\N
68707	t	tobechecked	\N
68708	t	tobechecked	\N
68709	t	tobechecked	\N
68710	t	tobechecked	\N
68711	t	tobechecked	\N
68712	t	tobechecked	\N
68713	t	tobechecked	\N
68714	t	tobechecked	\N
68715	t	tobechecked	\N
68718	f	tobechecked	\N
68719	f	tobechecked	\N
68720	f	tobechecked	\N
68730	f	tobechecked	\N
68735	f	tobechecked	\N
68738	f	tobechecked	\N
68742	t	tobechecked	\N
68743	t	tobechecked	\N
68744	t	tobechecked	\N
68745	t	tobechecked	\N
68746	t	tobechecked	\N
68747	t	tobechecked	\N
68748	t	tobechecked	\N
68749	t	tobechecked	\N
68750	t	tobechecked	\N
68751	t	tobechecked	\N
68752	t	tobechecked	\N
68753	t	tobechecked	\N
68754	t	tobechecked	\N
68755	t	tobechecked	\N
68756	t	tobechecked	\N
68757	t	tobechecked	\N
68758	t	tobechecked	\N
68759	f	tobechecked	\N
68760	t	tobechecked	\N
68761	t	tobechecked	\N
68762	t	tobechecked	\N
68763	t	tobechecked	\N
68764	t	tobechecked	\N
68765	t	tobechecked	\N
68766	t	tobechecked	\N
68769	t	tobechecked	\N
68772	t	tobechecked	\N
68776	t	tobechecked	\N
68779	t	tobechecked	\N
68784	t	tobechecked	\N
68792	t	tobechecked	\N
68797	f	tobechecked	\N
68798	f	tobechecked	\N
68799	f	tobechecked	\N
68800	f	tobechecked	\N
68801	f	tobechecked	\N
68802	t	tobechecked	\N
68803	t	tobechecked	\N
68804	t	tobechecked	\N
68805	f	tobechecked	\N
68806	f	tobechecked	\N
68807	f	tobechecked	\N
68808	f	tobechecked	\N
68809	f	tobechecked	\N
68810	t	tobechecked	\N
68811	t	tobechecked	\N
68812	t	tobechecked	\N
68813	t	tobechecked	\N
68814	t	tobechecked	\N
68815	t	tobechecked	\N
68816	f	tobechecked	\N
68817	t	tobechecked	\N
68818	t	tobechecked	\N
68819	f	tobechecked	\N
68820	f	tobechecked	\N
68821	f	tobechecked	\N
68822	t	tobechecked	\N
68823	t	tobechecked	\N
68824	t	tobechecked	\N
68825	t	tobechecked	\N
68826	t	tobechecked	\N
68827	t	tobechecked	\N
68828	t	tobechecked	\N
68829	f	tobechecked	\N
68830	f	tobechecked	\N
68831	f	tobechecked	\N
68832	t	tobechecked	\N
68833	t	tobechecked	\N
68834	t	tobechecked	\N
68835	t	tobechecked	\N
68836	t	tobechecked	\N
68837	t	tobechecked	\N
68838	f	tobechecked	\N
68839	f	tobechecked	\N
68840	t	tobechecked	\N
68841	f	tobechecked	\N
68842	f	tobechecked	\N
68843	t	tobechecked	\N
68844	t	tobechecked	\N
68845	t	tobechecked	\N
68846	t	tobechecked	\N
68847	f	tobechecked	\N
68848	f	tobechecked	\N
68849	t	tobechecked	\N
68850	t	tobechecked	\N
68851	f	tobechecked	\N
68852	t	tobechecked	\N
68853	f	tobechecked	\N
68854	f	tobechecked	\N
68855	t	tobechecked	\N
68856	t	tobechecked	\N
68857	t	tobechecked	\N
68858	t	tobechecked	\N
68859	f	tobechecked	\N
68860	f	tobechecked	\N
68861	t	tobechecked	\N
68862	f	tobechecked	\N
68863	t	tobechecked	\N
68864	f	tobechecked	\N
68865	f	tobechecked	\N
68866	t	tobechecked	\N
68867	f	tobechecked	\N
68868	f	tobechecked	\N
68869	f	tobechecked	\N
68870	f	tobechecked	\N
68871	f	tobechecked	\N
68872	f	tobechecked	\N
68873	t	tobechecked	\N
68874	f	tobechecked	\N
68875	f	tobechecked	\N
68876	t	tobechecked	\N
68877	t	tobechecked	\N
68878	f	tobechecked	\N
68879	f	tobechecked	\N
68880	t	tobechecked	\N
68881	t	tobechecked	\N
68882	t	tobechecked	\N
68883	t	tobechecked	\N
68884	t	tobechecked	\N
68885	t	tobechecked	\N
68886	t	tobechecked	\N
68887	t	tobechecked	\N
68888	t	tobechecked	\N
68889	t	tobechecked	\N
68890	t	tobechecked	\N
68891	t	tobechecked	\N
68892	t	tobechecked	\N
68893	f	tobechecked	\N
68894	f	tobechecked	\N
68895	f	tobechecked	\N
68896	f	tobechecked	\N
68897	f	tobechecked	\N
68898	f	tobechecked	\N
68899	f	tobechecked	\N
68900	f	tobechecked	\N
68901	f	tobechecked	\N
68902	f	tobechecked	\N
68903	f	tobechecked	\N
68904	f	tobechecked	\N
68905	f	tobechecked	\N
68906	f	tobechecked	\N
68907	f	tobechecked	\N
68908	f	tobechecked	\N
68909	f	tobechecked	\N
68910	f	tobechecked	\N
68911	f	tobechecked	\N
68912	f	tobechecked	\N
68913	t	tobechecked	\N
68914	f	tobechecked	\N
68915	f	tobechecked	\N
68916	f	tobechecked	\N
68917	f	tobechecked	\N
68918	f	tobechecked	\N
68919	f	tobechecked	\N
68920	f	tobechecked	\N
68921	f	tobechecked	\N
68922	f	tobechecked	\N
68923	f	tobechecked	\N
68924	f	tobechecked	\N
68925	f	tobechecked	\N
68926	f	tobechecked	\N
68927	f	tobechecked	\N
68928	f	tobechecked	\N
68929	f	tobechecked	\N
68930	f	tobechecked	\N
68931	f	tobechecked	\N
68932	t	tobechecked	\N
68933	t	tobechecked	\N
68934	f	tobechecked	\N
68935	t	tobechecked	\N
68936	t	tobechecked	\N
68937	t	tobechecked	\N
68938	t	tobechecked	\N
68939	t	tobechecked	\N
68940	t	tobechecked	\N
68941	t	tobechecked	\N
68942	f	tobechecked	\N
68943	f	tobechecked	\N
68944	f	tobechecked	\N
68945	f	tobechecked	\N
68946	f	tobechecked	\N
68947	f	tobechecked	\N
68948	f	tobechecked	\N
68949	f	tobechecked	\N
68950	f	tobechecked	\N
68951	f	tobechecked	\N
68952	f	tobechecked	\N
68953	f	tobechecked	\N
68954	f	tobechecked	\N
68955	f	tobechecked	\N
68956	f	tobechecked	\N
68957	f	tobechecked	\N
68958	f	tobechecked	\N
68959	f	tobechecked	\N
68960	f	tobechecked	\N
68961	f	tobechecked	\N
68962	f	tobechecked	\N
68963	f	tobechecked	\N
68964	f	tobechecked	\N
68965	f	tobechecked	\N
68966	f	tobechecked	\N
68967	f	tobechecked	\N
68968	f	tobechecked	\N
68969	f	tobechecked	\N
68970	f	tobechecked	\N
68971	f	tobechecked	\N
68972	f	tobechecked	\N
68973	f	tobechecked	\N
68974	f	tobechecked	\N
68975	f	tobechecked	\N
68976	f	tobechecked	\N
68977	f	tobechecked	\N
68978	f	tobechecked	\N
68979	f	tobechecked	\N
68980	f	tobechecked	\N
68981	f	tobechecked	\N
68982	f	tobechecked	\N
68983	f	tobechecked	\N
68984	f	tobechecked	\N
68985	f	tobechecked	\N
68986	f	tobechecked	\N
68987	f	tobechecked	\N
68988	f	tobechecked	\N
68989	f	tobechecked	\N
68990	f	tobechecked	\N
68991	f	tobechecked	\N
68992	f	tobechecked	\N
68993	f	tobechecked	\N
68994	f	tobechecked	\N
68995	f	tobechecked	\N
68996	f	tobechecked	\N
68997	f	tobechecked	\N
68998	f	tobechecked	\N
68999	t	tobechecked	\N
69000	t	tobechecked	\N
69001	f	tobechecked	\N
69002	f	tobechecked	\N
69003	f	tobechecked	\N
69004	f	tobechecked	\N
69005	f	tobechecked	\N
69006	t	tobechecked	\N
69007	t	tobechecked	\N
69008	f	tobechecked	\N
69009	f	tobechecked	\N
69010	f	tobechecked	\N
69011	f	tobechecked	\N
69012	f	tobechecked	\N
69013	f	tobechecked	\N
69014	t	tobechecked	\N
69015	t	tobechecked	\N
69016	t	tobechecked	\N
69017	t	tobechecked	\N
69018	t	tobechecked	\N
69019	t	tobechecked	\N
69020	t	tobechecked	\N
69021	t	tobechecked	\N
69022	t	tobechecked	\N
69023	t	tobechecked	\N
69024	t	tobechecked	\N
69025	f	tobechecked	\N
69026	f	tobechecked	\N
69027	t	tobechecked	\N
69028	f	tobechecked	\N
69029	f	tobechecked	\N
69030	f	tobechecked	\N
69038	t	tobechecked	\N
69057	t	tobechecked	\N
69058	t	tobechecked	\N
69059	t	tobechecked	\N
69060	t	tobechecked	\N
69061	t	tobechecked	\N
69065	t	tobechecked	\N
69067	t	tobechecked	\N
69068	t	tobechecked	\N
69069	t	tobechecked	\N
69070	t	tobechecked	\N
69071	t	tobechecked	\N
69072	t	tobechecked	\N
69073	t	tobechecked	\N
69074	t	tobechecked	\N
69075	t	tobechecked	\N
69076	t	tobechecked	\N
69077	t	tobechecked	\N
69078	t	tobechecked	\N
69079	t	tobechecked	\N
69080	t	tobechecked	\N
69081	t	tobechecked	\N
69082	t	tobechecked	\N
69083	t	tobechecked	\N
69084	t	tobechecked	\N
69085	t	tobechecked	\N
69086	t	tobechecked	\N
69087	t	tobechecked	\N
69095	t	tobechecked	\N
69107	f	tobechecked	2022-06-03 00:00:00
69108	f	tobechecked	2022-10-09 00:00:00
69109	f	tobechecked	2022-06-26 00:00:00
69110	f	tobechecked	2022-07-10 00:00:00
69111	f	tobechecked	2022-10-29 00:00:00
69112	t	tobechecked	\N
69113	f	tobechecked	2022-10-31 00:00:00
69114	t	tobechecked	\N
69116	t	tobechecked	\N
69120	t	tobechecked	\N
69121	f	tobechecked	\N
69122	f	tobechecked	\N
69123	t	tobechecked	\N
69124	f	tobechecked	\N
69125	f	tobechecked	\N
69126	t	tobechecked	\N
69127	t	tobechecked	\N
69128	t	tobechecked	\N
69129	f	tobechecked	\N
69130	f	tobechecked	\N
69131	t	tobechecked	\N
69132	t	tobechecked	\N
69133	t	tobechecked	\N
69134	t	tobechecked	\N
69135	f	tobechecked	\N
69136	f	tobechecked	\N
69137	f	tobechecked	\N
69138	f	tobechecked	\N
69139	t	tobechecked	\N
69140	t	tobechecked	\N
69141	t	tobechecked	\N
69142	t	tobechecked	\N
69143	t	tobechecked	\N
69144	t	tobechecked	\N
69146	t	tobechecked	\N
69148	t	tobechecked	\N
69149	t	tobechecked	\N
69167	t	tobechecked	\N
69168	t	tobechecked	\N
69169	f	tobechecked	\N
69170	f	tobechecked	\N
69205	f	tobechecked	\N
69208	f	tobechecked	\N
69210	f	tobechecked	\N
69230	t	tobechecked	\N
69231	t	tobechecked	\N
69232	t	tobechecked	\N
69233	t	tobechecked	\N
69234	t	tobechecked	\N
69235	t	tobechecked	\N
69236	t	tobechecked	\N
69237	t	tobechecked	\N
69238	t	tobechecked	\N
69239	t	tobechecked	\N
69240	t	tobechecked	\N
69241	t	tobechecked	\N
69242	t	tobechecked	\N
69243	t	tobechecked	\N
69244	t	tobechecked	\N
69245	f	tobechecked	\N
69246	t	tobechecked	\N
69247	t	tobechecked	\N
69248	t	tobechecked	\N
69249	t	tobechecked	\N
69250	t	tobechecked	\N
69251	t	tobechecked	\N
69252	t	tobechecked	\N
69253	t	tobechecked	\N
69254	t	tobechecked	\N
69255	t	tobechecked	\N
69256	t	tobechecked	\N
69267	f	tobechecked	\N
69274	f	tobechecked	\N
69280	f	tobechecked	\N
69281	f	tobechecked	\N
69282	f	tobechecked	\N
69283	f	tobechecked	\N
69285	f	tobechecked	\N
69286	f	tobechecked	\N
69295	t	tobechecked	\N
69301	f	tobechecked	\N
69303	f	tobechecked	\N
69304	f	tobechecked	\N
69311	f	tobechecked	\N
69338	t	tobechecked	\N
69339	f	tobechecked	\N
69340	f	tobechecked	\N
69341	t	tobechecked	\N
69342	t	tobechecked	\N
69343	t	tobechecked	\N
69344	t	tobechecked	\N
69345	t	tobechecked	\N
69346	t	tobechecked	\N
69347	t	tobechecked	\N
69348	t	tobechecked	\N
69349	t	tobechecked	\N
69350	t	tobechecked	\N
69351	t	tobechecked	\N
69352	t	tobechecked	\N
69353	t	tobechecked	\N
69354	t	tobechecked	\N
69355	t	tobechecked	\N
69356	t	tobechecked	\N
69357	t	tobechecked	\N
69358	t	tobechecked	\N
69359	t	tobechecked	\N
69360	t	tobechecked	\N
69361	t	tobechecked	\N
69362	t	tobechecked	\N
69363	t	tobechecked	\N
69364	t	tobechecked	\N
69365	t	tobechecked	\N
69366	t	tobechecked	\N
69367	t	tobechecked	\N
69368	t	tobechecked	\N
69369	t	tobechecked	\N
69370	t	tobechecked	\N
69371	t	tobechecked	\N
69372	t	tobechecked	\N
69373	t	tobechecked	\N
69374	t	tobechecked	\N
69375	t	tobechecked	\N
69376	t	tobechecked	\N
69377	t	tobechecked	\N
69378	t	tobechecked	\N
69379	t	tobechecked	\N
69380	t	tobechecked	\N
69381	t	tobechecked	\N
69382	t	tobechecked	\N
69383	t	tobechecked	\N
69384	t	tobechecked	\N
69385	t	tobechecked	\N
69386	t	tobechecked	\N
69387	t	tobechecked	\N
69388	t	tobechecked	\N
69389	t	tobechecked	\N
69390	t	tobechecked	\N
69391	t	tobechecked	\N
69392	t	tobechecked	\N
69393	t	tobechecked	\N
69394	t	tobechecked	\N
69395	t	tobechecked	\N
69396	t	tobechecked	\N
69397	t	tobechecked	\N
69398	t	tobechecked	\N
69399	t	tobechecked	\N
69408	f	tobechecked	\N
69409	f	tobechecked	\N
69417	f	tobechecked	2023-04-30 00:00:00
69418	t	tobechecked	\N
69419	t	tobechecked	\N
69420	t	tobechecked	\N
69421	t	tobechecked	\N
69422	t	tobechecked	\N
69427	t	tobechecked	\N
69428	t	tobechecked	\N
69435	t	tobechecked	\N
69454	t	tobechecked	\N
69455	t	tobechecked	\N
69498	t	tobechecked	\N
69504	t	tobechecked	\N
69506	t	tobechecked	\N
69508	f	tobechecked	\N
69510	f	tobechecked	\N
69514	t	tobechecked	\N
69515	f	tobechecked	\N
69522	t	tobechecked	\N
69523	f	tobechecked	\N
69524	f	tobechecked	\N
69530	t	tobechecked	\N
69531	t	tobechecked	\N
69532	t	tobechecked	\N
69533	t	tobechecked	\N
69534	t	tobechecked	\N
69540	t	tobechecked	\N
69548	t	tobechecked	\N
69549	t	tobechecked	\N
69550	t	tobechecked	\N
69551	t	tobechecked	\N
69562	t	tobechecked	\N
69563	t	tobechecked	\N
69564	t	tobechecked	\N
69565	f	tobechecked	\N
69566	t	tobechecked	\N
69567	t	tobechecked	\N
69568	t	tobechecked	\N
69569	t	tobechecked	\N
69570	t	tobechecked	\N
69571	t	tobechecked	\N
69572	t	tobechecked	\N
69573	t	tobechecked	\N
69574	t	tobechecked	\N
69575	t	tobechecked	\N
69576	f	tobechecked	\N
69577	t	tobechecked	\N
69578	t	tobechecked	\N
69579	t	tobechecked	\N
69580	t	tobechecked	\N
69581	t	tobechecked	\N
69582	t	tobechecked	\N
69584	t	tobechecked	\N
69585	t	tobechecked	\N
69586	f	tobechecked	\N
69587	f	tobechecked	\N
69588	f	tobechecked	\N
69589	f	tobechecked	\N
69590	f	tobechecked	\N
69591	f	tobechecked	\N
69592	f	tobechecked	\N
69593	f	tobechecked	\N
69594	f	tobechecked	\N
69595	f	tobechecked	\N
69596	f	tobechecked	\N
69597	f	tobechecked	\N
69598	f	tobechecked	\N
69599	f	tobechecked	\N
69600	f	tobechecked	\N
69601	f	tobechecked	\N
69602	f	tobechecked	\N
69641	t	tobechecked	\N
69642	t	tobechecked	\N
69643	t	tobechecked	\N
69654	f	tobechecked	2023-08-31 00:00:00
69655	f	tobechecked	2022-06-11 00:00:00
69656	f	tobechecked	2023-04-28 00:00:00
69657	f	tobechecked	2023-07-31 00:00:00
69658	t	tobechecked	\N
69666	t	tobechecked	\N
69670	t	tobechecked	\N
69674	f	tobechecked	\N
69676	t	tobechecked	\N
69677	t	tobechecked	\N
69678	t	tobechecked	\N
69679	t	tobechecked	\N
69680	t	tobechecked	\N
69681	t	tobechecked	\N
69682	t	tobechecked	\N
69683	t	tobechecked	\N
69684	t	tobechecked	\N
69685	t	tobechecked	\N
69686	t	tobechecked	\N
69687	t	tobechecked	\N
69688	t	tobechecked	\N
69689	t	tobechecked	\N
69690	t	tobechecked	\N
69691	t	tobechecked	\N
69692	t	tobechecked	\N
69693	t	tobechecked	\N
69694	t	tobechecked	\N
69695	t	tobechecked	\N
69696	t	tobechecked	\N
69697	t	tobechecked	\N
69698	t	tobechecked	\N
69699	t	tobechecked	\N
69700	t	tobechecked	\N
69701	t	tobechecked	\N
69702	t	tobechecked	\N
69703	t	tobechecked	\N
69704	t	tobechecked	\N
69705	t	tobechecked	\N
69706	t	tobechecked	\N
69707	t	tobechecked	\N
69708	t	tobechecked	\N
69709	t	tobechecked	\N
69710	t	tobechecked	\N
69711	t	tobechecked	\N
69712	t	tobechecked	\N
69713	t	tobechecked	\N
69714	t	tobechecked	\N
69715	t	tobechecked	\N
69716	t	tobechecked	\N
69717	t	tobechecked	\N
69718	t	tobechecked	\N
69719	t	tobechecked	\N
69720	t	tobechecked	\N
69721	t	tobechecked	\N
69722	t	tobechecked	\N
69723	t	tobechecked	\N
69724	t	tobechecked	\N
69725	t	tobechecked	\N
69726	t	tobechecked	\N
69727	t	tobechecked	\N
69728	t	tobechecked	\N
69729	t	tobechecked	\N
69730	t	tobechecked	\N
69731	t	tobechecked	\N
69732	t	tobechecked	\N
69733	t	tobechecked	\N
69734	t	tobechecked	\N
69735	t	tobechecked	\N
69736	t	tobechecked	\N
69737	t	tobechecked	\N
69738	t	tobechecked	\N
69739	t	tobechecked	\N
69740	t	tobechecked	\N
69741	t	tobechecked	\N
69742	t	tobechecked	\N
69743	t	tobechecked	\N
69744	t	tobechecked	\N
69745	t	tobechecked	\N
69746	t	tobechecked	\N
69747	t	tobechecked	\N
69748	t	tobechecked	\N
69749	t	tobechecked	\N
69750	t	tobechecked	\N
69751	t	tobechecked	\N
69752	t	tobechecked	\N
69753	t	tobechecked	\N
69754	t	tobechecked	\N
69755	t	tobechecked	\N
69756	t	tobechecked	\N
69757	t	tobechecked	\N
69758	t	tobechecked	\N
69759	t	tobechecked	\N
69760	t	tobechecked	\N
69761	t	tobechecked	\N
69762	t	tobechecked	\N
69763	t	tobechecked	\N
69764	t	tobechecked	\N
69765	t	tobechecked	\N
69766	t	tobechecked	\N
69767	t	tobechecked	\N
69768	t	tobechecked	\N
69769	t	tobechecked	\N
69770	t	tobechecked	\N
69771	t	tobechecked	\N
69772	t	tobechecked	\N
69773	t	tobechecked	\N
69774	t	tobechecked	\N
69777	f	tobechecked	\N
69778	f	tobechecked	\N
69779	f	tobechecked	\N
69816	f	tobechecked	\N
69926	f	tobechecked	\N
69937	f	tobechecked	\N
69948	f	tobechecked	\N
69952	f	tobechecked	\N
69953	f	tobechecked	\N
69976	f	tobechecked	\N
69977	f	tobechecked	\N
69978	f	tobechecked	\N
70005	f	tobechecked	\N
70008	f	tobechecked	\N
70010	f	tobechecked	\N
70013	f	tobechecked	\N
70019	f	tobechecked	\N
70032	t	tobechecked	\N
70085	t	tobechecked	\N
70092	t	tobechecked	\N
70116	f	tobechecked	\N
70118	f	tobechecked	\N
70120	f	tobechecked	\N
70122	f	tobechecked	\N
70126	f	tobechecked	\N
70127	f	tobechecked	\N
70143	f	tobechecked	2024-01-29 00:00:00
70144	f	tobechecked	2024-01-29 00:00:00
70145	t	tobechecked	\N
70146	f	tobechecked	2022-10-03 00:00:00
70148	f	tobechecked	2024-02-05 00:00:00
70152	t	tobechecked	\N
70153	t	tobechecked	\N
70157	t	tobechecked	\N
70159	t	tobechecked	\N
70161	t	tobechecked	\N
70197	t	tobechecked	\N
70201	t	tobechecked	\N
70203	t	tobechecked	\N
70204	t	tobechecked	\N
70205	t	tobechecked	\N
70206	f	tobechecked	\N
70211	f	tobechecked	\N
70213	f	tobechecked	\N
70220	t	tobechecked	\N
70223	t	tobechecked	\N
70228	t	tobechecked	\N
70232	t	tobechecked	\N
70235	t	tobechecked	\N
70236	t	tobechecked	\N
70237	t	tobechecked	\N
70238	t	tobechecked	\N
70239	t	tobechecked	\N
70240	t	tobechecked	\N
70241	t	tobechecked	\N
70242	t	tobechecked	\N
70243	t	tobechecked	\N
70244	t	tobechecked	\N
70245	t	tobechecked	\N
70246	t	tobechecked	\N
70247	t	tobechecked	\N
70248	t	tobechecked	\N
70249	t	tobechecked	\N
70250	t	tobechecked	\N
70251	t	tobechecked	\N
70252	t	tobechecked	\N
70253	t	tobechecked	\N
70254	t	tobechecked	\N
70255	t	tobechecked	\N
70256	t	tobechecked	\N
70257	t	tobechecked	\N
70258	t	tobechecked	\N
70259	t	tobechecked	\N
70260	t	tobechecked	\N
70261	t	tobechecked	\N
70262	t	tobechecked	\N
70269	t	tobechecked	\N
70275	t	tobechecked	\N
70277	f	tobechecked	\N
70278	f	tobechecked	\N
70279	f	tobechecked	\N
70280	f	tobechecked	\N
70281	f	tobechecked	\N
70282	f	tobechecked	\N
70283	f	tobechecked	\N
70284	t	tobechecked	\N
70285	f	tobechecked	\N
70286	t	tobechecked	\N
70287	t	tobechecked	\N
70288	t	tobechecked	\N
70289	f	tobechecked	\N
70290	t	tobechecked	\N
70291	f	tobechecked	\N
70292	f	tobechecked	\N
70293	f	tobechecked	\N
70294	f	tobechecked	\N
70295	f	tobechecked	\N
70296	f	tobechecked	\N
70297	f	tobechecked	\N
70298	f	tobechecked	\N
70299	f	tobechecked	\N
70300	t	tobechecked	\N
70301	f	tobechecked	\N
70302	t	tobechecked	\N
70303	f	tobechecked	\N
70304	f	tobechecked	\N
70305	f	tobechecked	\N
70306	f	tobechecked	\N
70307	f	tobechecked	\N
70308	f	tobechecked	\N
70309	f	tobechecked	\N
70310	f	tobechecked	\N
70311	f	tobechecked	\N
70312	f	tobechecked	\N
70313	f	tobechecked	\N
70314	f	tobechecked	\N
70315	f	tobechecked	\N
70316	f	tobechecked	\N
70317	f	tobechecked	\N
70318	f	tobechecked	\N
70319	f	tobechecked	\N
70320	f	tobechecked	\N
70321	f	tobechecked	\N
70322	f	tobechecked	\N
70323	f	tobechecked	\N
70324	f	tobechecked	\N
70325	f	tobechecked	\N
70326	f	tobechecked	\N
70327	f	tobechecked	\N
70328	f	tobechecked	\N
70329	f	tobechecked	\N
70330	f	tobechecked	\N
70331	f	tobechecked	\N
70332	t	tobechecked	\N
70333	t	tobechecked	\N
70334	t	tobechecked	\N
70335	f	tobechecked	\N
70336	f	tobechecked	\N
70337	f	tobechecked	\N
70338	f	tobechecked	\N
70339	f	tobechecked	\N
70340	f	tobechecked	\N
70341	f	tobechecked	\N
70342	f	tobechecked	\N
70343	f	tobechecked	\N
70344	f	tobechecked	\N
70345	f	tobechecked	\N
70346	f	tobechecked	\N
70347	f	tobechecked	\N
70348	f	tobechecked	\N
70349	f	tobechecked	\N
70350	f	tobechecked	\N
70351	f	tobechecked	\N
70352	f	tobechecked	\N
70353	f	tobechecked	\N
70354	f	tobechecked	\N
70355	f	tobechecked	\N
70356	f	tobechecked	\N
70357	f	tobechecked	\N
70358	f	tobechecked	\N
70359	f	tobechecked	\N
70360	f	tobechecked	\N
70361	f	tobechecked	\N
70376	f	tobechecked	\N
70377	f	tobechecked	\N
70378	t	tobechecked	\N
70379	t	tobechecked	\N
70380	t	tobechecked	\N
70381	t	tobechecked	\N
70382	t	tobechecked	\N
70383	t	tobechecked	\N
70384	t	tobechecked	\N
70385	t	tobechecked	\N
70386	t	tobechecked	\N
70387	t	tobechecked	\N
70399	f	tobechecked	\N
70401	f	tobechecked	\N
70402	f	tobechecked	\N
70403	f	tobechecked	\N
70404	f	tobechecked	\N
70405	f	tobechecked	\N
70406	f	tobechecked	\N
70407	f	tobechecked	\N
70408	f	tobechecked	\N
70409	f	tobechecked	\N
70410	f	tobechecked	\N
70411	f	tobechecked	\N
70412	f	tobechecked	\N
70413	f	tobechecked	\N
70414	f	tobechecked	\N
70415	f	tobechecked	\N
70416	f	tobechecked	\N
70417	f	tobechecked	\N
70418	f	tobechecked	\N
70419	f	tobechecked	\N
70420	f	tobechecked	\N
70421	f	tobechecked	\N
70422	f	tobechecked	\N
70423	f	tobechecked	\N
70424	f	tobechecked	\N
70425	f	tobechecked	\N
70426	f	tobechecked	\N
70427	f	tobechecked	\N
70428	f	tobechecked	\N
70450	t	tobechecked	\N
70451	t	tobechecked	\N
70452	t	tobechecked	\N
70453	t	tobechecked	\N
70454	t	tobechecked	\N
70455	t	tobechecked	\N
70456	t	tobechecked	\N
70457	t	tobechecked	\N
70459	t	tobechecked	\N
70460	t	tobechecked	\N
70461	t	tobechecked	\N
70462	t	tobechecked	\N
70463	t	tobechecked	\N
70467	t	tobechecked	\N
70468	t	tobechecked	\N
70469	t	tobechecked	\N
70471	t	tobechecked	\N
70476	t	tobechecked	\N
70478	t	tobechecked	\N
70479	t	tobechecked	\N
70480	t	tobechecked	\N
70481	f	tobechecked	\N
70482	t	tobechecked	\N
70483	t	tobechecked	\N
70484	t	tobechecked	\N
70485	t	tobechecked	\N
70486	t	tobechecked	\N
70487	t	tobechecked	\N
70488	t	tobechecked	\N
70489	t	tobechecked	\N
70490	t	tobechecked	\N
70491	t	tobechecked	\N
70492	t	tobechecked	\N
70493	t	tobechecked	\N
70494	t	tobechecked	\N
70495	t	tobechecked	\N
70496	t	tobechecked	\N
70497	t	tobechecked	\N
70498	t	tobechecked	\N
70500	t	tobechecked	\N
70502	t	tobechecked	\N
70503	t	tobechecked	\N
70504	t	tobechecked	\N
70505	t	tobechecked	\N
70507	t	tobechecked	\N
70509	t	tobechecked	\N
70510	t	tobechecked	\N
70511	t	tobechecked	\N
70512	t	tobechecked	\N
70513	t	tobechecked	\N
70514	t	tobechecked	\N
70515	t	tobechecked	\N
70516	t	tobechecked	\N
70517	t	tobechecked	\N
70518	t	tobechecked	\N
70519	t	tobechecked	\N
70520	t	tobechecked	\N
70521	t	tobechecked	\N
70522	t	tobechecked	\N
70523	t	tobechecked	\N
70524	t	tobechecked	\N
70525	t	tobechecked	\N
70526	t	tobechecked	\N
70530	t	tobechecked	\N
70531	t	tobechecked	\N
70532	t	tobechecked	\N
70533	t	tobechecked	\N
70534	t	tobechecked	\N
70535	t	tobechecked	\N
70536	t	tobechecked	\N
70538	t	tobechecked	\N
70542	t	tobechecked	\N
70543	t	tobechecked	\N
70544	t	tobechecked	\N
70545	t	tobechecked	\N
70546	t	tobechecked	\N
70550	t	tobechecked	\N
70554	t	tobechecked	\N
70555	t	tobechecked	\N
70556	t	tobechecked	\N
70557	t	tobechecked	\N
70560	t	tobechecked	\N
70561	t	tobechecked	\N
70562	t	tobechecked	\N
70563	t	tobechecked	\N
70564	t	tobechecked	\N
70565	t	tobechecked	\N
70566	t	tobechecked	\N
70567	t	tobechecked	\N
70568	t	tobechecked	\N
70569	t	tobechecked	\N
70570	t	tobechecked	\N
70571	t	tobechecked	\N
70572	t	tobechecked	\N
70573	t	tobechecked	\N
70574	t	tobechecked	\N
70575	t	tobechecked	\N
70576	t	tobechecked	\N
70577	t	tobechecked	\N
70578	t	tobechecked	\N
70579	t	tobechecked	\N
70580	t	tobechecked	\N
70581	t	tobechecked	\N
70582	t	tobechecked	\N
70583	t	tobechecked	\N
70585	t	tobechecked	\N
70586	t	tobechecked	\N
70588	t	tobechecked	\N
70589	t	tobechecked	\N
70590	t	tobechecked	\N
70591	t	tobechecked	\N
70592	t	tobechecked	\N
70594	t	tobechecked	\N
70595	t	tobechecked	\N
70596	t	tobechecked	\N
70597	t	tobechecked	\N
70598	t	tobechecked	\N
70599	t	tobechecked	\N
70600	t	tobechecked	\N
70601	t	tobechecked	\N
70602	t	tobechecked	\N
70603	t	tobechecked	\N
70604	t	tobechecked	\N
70605	t	tobechecked	\N
70606	t	tobechecked	\N
70607	t	tobechecked	\N
70608	t	tobechecked	\N
70609	t	tobechecked	\N
70610	t	tobechecked	\N
70611	t	tobechecked	\N
70612	t	tobechecked	\N
70613	t	tobechecked	\N
70614	t	tobechecked	\N
70615	t	tobechecked	\N
70616	t	tobechecked	\N
70617	t	tobechecked	\N
70618	t	tobechecked	\N
70619	t	tobechecked	\N
70620	t	tobechecked	\N
70621	t	tobechecked	\N
70622	t	tobechecked	\N
70623	t	tobechecked	\N
70624	t	tobechecked	\N
70625	t	tobechecked	\N
70626	t	tobechecked	\N
70627	t	tobechecked	\N
70628	t	tobechecked	\N
70629	t	tobechecked	\N
70630	t	tobechecked	\N
70631	t	tobechecked	\N
70632	t	tobechecked	\N
70633	t	tobechecked	\N
70634	t	tobechecked	\N
70636	t	tobechecked	\N
70637	t	tobechecked	\N
70640	t	tobechecked	\N
70641	t	tobechecked	\N
70649	t	tobechecked	\N
70650	t	tobechecked	\N
70651	t	tobechecked	\N
70652	t	tobechecked	\N
70653	t	tobechecked	\N
70655	t	tobechecked	\N
70656	t	tobechecked	\N
70657	t	tobechecked	\N
70658	t	tobechecked	\N
70659	t	tobechecked	\N
70660	t	tobechecked	\N
70661	t	tobechecked	\N
70662	t	tobechecked	\N
70664	t	tobechecked	\N
70665	t	tobechecked	\N
70666	t	tobechecked	\N
70667	t	tobechecked	\N
70668	t	tobechecked	\N
70669	t	tobechecked	\N
70670	t	tobechecked	\N
70671	t	tobechecked	\N
70672	t	tobechecked	\N
70673	t	tobechecked	\N
70674	t	tobechecked	\N
70675	t	tobechecked	\N
70676	t	tobechecked	\N
70677	t	tobechecked	\N
70678	t	tobechecked	\N
70679	t	tobechecked	\N
70680	t	tobechecked	\N
70681	t	tobechecked	\N
70682	t	tobechecked	\N
70683	t	tobechecked	\N
70684	t	tobechecked	\N
70685	t	tobechecked	\N
70686	t	tobechecked	\N
70687	t	tobechecked	\N
70689	t	tobechecked	\N
70691	t	tobechecked	\N
70698	t	tobechecked	\N
70701	t	tobechecked	\N
70702	t	tobechecked	\N
70703	t	tobechecked	\N
70705	t	tobechecked	\N
70706	t	tobechecked	\N
70709	t	tobechecked	\N
70710	t	tobechecked	\N
70712	f	tobechecked	\N
70713	f	tobechecked	\N
70714	f	tobechecked	\N
70715	t	tobechecked	\N
70716	t	tobechecked	\N
70717	t	tobechecked	\N
70718	t	tobechecked	\N
70719	t	tobechecked	\N
70720	t	tobechecked	\N
70721	t	tobechecked	\N
70722	t	tobechecked	\N
70723	f	tobechecked	\N
70724	f	tobechecked	\N
70725	f	tobechecked	\N
70726	f	tobechecked	\N
70727	f	tobechecked	\N
70728	f	tobechecked	\N
70729	f	tobechecked	\N
70730	t	tobechecked	\N
70731	f	tobechecked	\N
70732	f	tobechecked	\N
70733	f	tobechecked	\N
70734	f	tobechecked	\N
70735	f	tobechecked	\N
70736	f	tobechecked	\N
70737	f	tobechecked	\N
70738	f	tobechecked	\N
70739	f	tobechecked	\N
70740	f	tobechecked	\N
70741	f	tobechecked	\N
70742	f	tobechecked	\N
70743	f	tobechecked	\N
70744	f	tobechecked	\N
70745	f	tobechecked	\N
70746	f	tobechecked	\N
70756	t	tobechecked	\N
70757	t	tobechecked	\N
70758	t	tobechecked	\N
70759	t	tobechecked	\N
70760	t	tobechecked	\N
70761	t	tobechecked	\N
70762	t	tobechecked	\N
70763	t	tobechecked	\N
70764	t	tobechecked	\N
70765	t	tobechecked	\N
70766	t	tobechecked	\N
70767	t	tobechecked	\N
70768	t	tobechecked	\N
70769	t	tobechecked	\N
70770	t	tobechecked	\N
70771	t	tobechecked	\N
70773	t	tobechecked	\N
70775	t	tobechecked	\N
70778	f	tobechecked	\N
70781	t	tobechecked	\N
70794	t	tobechecked	\N
70819	t	tobechecked	\N
70822	t	tobechecked	\N
70824	t	tobechecked	\N
70829	t	tobechecked	\N
70832	t	tobechecked	\N
70836	t	tobechecked	\N
70838	f	tobechecked	\N
70840	t	tobechecked	\N
70842	t	tobechecked	\N
70843	t	tobechecked	\N
70844	t	tobechecked	\N
70845	t	tobechecked	\N
70846	t	tobechecked	\N
70848	t	tobechecked	\N
70849	t	tobechecked	\N
70852	t	tobechecked	\N
70855	t	tobechecked	\N
70865	f	tobechecked	\N
70866	t	tobechecked	\N
70867	f	tobechecked	\N
70896	t	tobechecked	\N
70897	t	tobechecked	\N
70898	t	tobechecked	\N
70899	t	tobechecked	\N
70900	t	tobechecked	\N
70920	t	tobechecked	\N
70929	f	tobechecked	\N
70930	f	tobechecked	2024-09-17 00:00:00
70931	f	tobechecked	2024-03-01 00:00:00
70932	f	tobechecked	2025-03-30 00:00:00
70933	t	tobechecked	\N
70934	f	tobechecked	2024-05-12 00:00:00
70935	t	tobechecked	\N
70936	f	tobechecked	2023-10-06 00:00:00
70937	f	tobechecked	2023-11-27 00:00:00
70938	f	tobechecked	2024-03-23 00:00:00
70939	f	tobechecked	2024-07-06 00:00:00
70940	f	tobechecked	2023-05-22 00:00:00
70943	t	tobechecked	\N
70947	t	tobechecked	\N
70948	t	tobechecked	\N
70949	t	tobechecked	\N
70950	t	tobechecked	\N
70952	f	tobechecked	\N
70953	f	tobechecked	\N
70954	f	tobechecked	\N
70955	f	tobechecked	\N
70956	f	tobechecked	\N
70957	f	tobechecked	\N
70958	f	tobechecked	\N
70959	f	tobechecked	\N
70960	f	tobechecked	\N
70961	f	tobechecked	\N
70962	f	tobechecked	\N
70963	f	tobechecked	\N
70964	f	tobechecked	\N
70965	f	tobechecked	\N
70966	f	tobechecked	\N
70967	f	tobechecked	\N
70968	f	tobechecked	\N
70969	f	tobechecked	\N
70970	f	tobechecked	\N
70971	f	tobechecked	\N
70972	f	tobechecked	\N
70973	f	tobechecked	\N
70974	f	tobechecked	\N
70975	f	tobechecked	\N
70976	f	tobechecked	\N
70978	t	tobechecked	\N
70979	t	tobechecked	\N
70980	t	tobechecked	\N
70981	t	tobechecked	\N
70982	t	tobechecked	\N
70983	t	tobechecked	\N
70984	t	tobechecked	\N
70985	t	tobechecked	\N
70986	t	tobechecked	\N
70987	t	tobechecked	\N
70988	t	tobechecked	\N
70989	t	tobechecked	\N
70990	t	tobechecked	\N
70991	t	tobechecked	\N
70992	t	tobechecked	\N
70993	t	tobechecked	\N
70994	t	tobechecked	\N
70995	t	tobechecked	\N
70996	t	tobechecked	\N
70997	t	tobechecked	\N
70998	f	tobechecked	\N
70999	f	tobechecked	\N
71008	t	tobechecked	\N
71010	t	tobechecked	\N
71023	t	tobechecked	\N
71026	t	tobechecked	\N
71029	t	tobechecked	\N
71038	t	tobechecked	\N
71040	t	tobechecked	\N
71042	t	tobechecked	\N
71046	t	tobechecked	\N
71047	t	tobechecked	\N
71048	t	tobechecked	\N
71057	t	tobechecked	\N
71058	t	tobechecked	\N
71063	t	tobechecked	\N
71064	t	tobechecked	\N
71081	t	tobechecked	\N
71092	t	tobechecked	\N
71098	f	tobechecked	\N
71101	t	tobechecked	\N
71105	t	tobechecked	\N
71106	t	tobechecked	\N
71107	t	tobechecked	\N
71109	t	tobechecked	\N
71110	t	tobechecked	\N
71113	t	tobechecked	\N
71114	t	tobechecked	\N
71115	t	tobechecked	\N
71116	t	tobechecked	\N
71117	t	tobechecked	\N
71118	t	tobechecked	\N
71119	t	tobechecked	\N
71120	t	tobechecked	\N
71121	t	tobechecked	\N
71122	t	tobechecked	\N
71123	t	tobechecked	\N
71124	t	tobechecked	\N
71130	t	tobechecked	\N
71131	t	tobechecked	\N
71132	t	tobechecked	\N
71133	t	tobechecked	\N
71140	t	tobechecked	\N
71164	t	tobechecked	\N
71167	t	tobechecked	\N
71189	t	tobechecked	\N
71213	t	tobechecked	\N
71214	t	tobechecked	\N
71215	t	tobechecked	\N
71216	t	tobechecked	\N
71217	t	tobechecked	\N
71218	t	tobechecked	\N
71219	t	tobechecked	\N
71220	t	tobechecked	\N
71221	t	tobechecked	\N
71222	t	tobechecked	\N
71223	t	tobechecked	\N
71224	t	tobechecked	\N
71225	t	tobechecked	\N
71226	t	tobechecked	\N
71227	t	tobechecked	\N
71234	t	tobechecked	\N
71242	t	tobechecked	\N
71246	t	tobechecked	\N
71248	t	tobechecked	\N
71249	t	tobechecked	\N
71251	t	tobechecked	\N
71252	t	tobechecked	\N
71254	t	tobechecked	\N
71255	t	tobechecked	\N
71256	t	tobechecked	\N
71257	t	tobechecked	\N
71258	t	tobechecked	\N
71259	t	tobechecked	\N
71260	t	tobechecked	\N
71261	t	tobechecked	\N
71262	t	tobechecked	\N
71264	t	tobechecked	\N
71267	t	tobechecked	\N
71269	t	tobechecked	\N
71272	t	tobechecked	\N
71273	t	tobechecked	\N
71274	t	tobechecked	\N
71279	t	tobechecked	\N
71280	t	tobechecked	\N
71282	t	tobechecked	\N
71285	f	tobechecked	\N
71292	t	tobechecked	\N
71293	t	tobechecked	\N
71294	t	tobechecked	\N
71309	t	tobechecked	\N
71310	t	tobechecked	\N
71312	f	tobechecked	\N
71314	t	tobechecked	\N
71316	f	tobechecked	\N
71338	f	tobechecked	\N
71340	f	tobechecked	\N
71341	f	tobechecked	\N
71342	t	tobechecked	\N
71343	t	tobechecked	\N
71344	t	tobechecked	\N
71345	t	tobechecked	\N
71346	t	tobechecked	\N
71347	t	tobechecked	\N
71348	t	tobechecked	\N
71349	t	tobechecked	\N
71350	f	tobechecked	\N
71351	t	tobechecked	\N
71352	t	tobechecked	\N
71353	t	tobechecked	\N
71354	t	tobechecked	\N
71355	t	tobechecked	\N
71356	t	tobechecked	\N
71357	t	tobechecked	\N
71358	t	tobechecked	\N
71359	t	tobechecked	\N
71360	t	tobechecked	\N
71361	t	tobechecked	\N
71362	t	tobechecked	\N
71363	t	tobechecked	\N
71364	t	tobechecked	\N
71365	f	tobechecked	\N
71374	t	tobechecked	\N
71418	t	tobechecked	\N
71419	t	tobechecked	\N
71420	t	tobechecked	\N
71421	t	tobechecked	\N
71422	t	tobechecked	\N
71423	t	tobechecked	\N
71424	t	tobechecked	\N
71425	t	tobechecked	\N
71426	t	tobechecked	\N
71427	t	tobechecked	\N
71428	t	tobechecked	\N
71429	t	tobechecked	\N
71430	t	tobechecked	\N
71431	t	tobechecked	\N
71432	t	tobechecked	\N
71433	t	tobechecked	\N
71434	t	tobechecked	\N
71435	t	tobechecked	\N
71436	t	tobechecked	\N
71437	t	tobechecked	\N
71438	t	tobechecked	\N
71439	t	tobechecked	\N
71440	t	tobechecked	\N
71441	t	tobechecked	\N
71442	t	tobechecked	\N
71443	t	tobechecked	\N
71444	t	tobechecked	\N
71445	t	tobechecked	\N
71446	t	tobechecked	\N
71447	t	tobechecked	\N
71448	t	tobechecked	\N
71449	t	tobechecked	\N
71450	t	tobechecked	\N
71451	t	tobechecked	\N
71452	t	tobechecked	\N
71453	t	tobechecked	\N
71454	t	tobechecked	\N
71455	t	tobechecked	\N
71456	t	tobechecked	\N
71457	t	tobechecked	\N
71458	t	tobechecked	\N
71459	t	tobechecked	\N
71460	t	tobechecked	\N
71461	t	tobechecked	\N
71462	t	tobechecked	\N
71463	t	tobechecked	\N
71464	t	tobechecked	\N
71465	t	tobechecked	\N
71466	t	tobechecked	\N
71467	t	tobechecked	\N
71468	t	tobechecked	\N
71469	t	tobechecked	\N
71470	t	tobechecked	\N
71471	t	tobechecked	\N
71472	t	tobechecked	\N
71473	t	tobechecked	\N
71474	t	tobechecked	\N
71475	t	tobechecked	\N
71476	t	tobechecked	\N
71477	t	tobechecked	\N
71478	t	tobechecked	\N
71479	t	tobechecked	\N
71480	t	tobechecked	\N
71481	t	tobechecked	\N
71482	t	tobechecked	\N
71483	t	tobechecked	\N
71484	t	tobechecked	\N
71485	t	tobechecked	\N
71486	t	tobechecked	\N
71487	t	tobechecked	\N
71488	t	tobechecked	\N
71489	t	tobechecked	\N
71490	t	tobechecked	\N
71491	t	tobechecked	\N
71492	t	tobechecked	\N
71493	t	tobechecked	\N
71494	t	tobechecked	\N
71495	t	tobechecked	\N
71496	t	tobechecked	\N
71497	t	tobechecked	\N
71498	t	tobechecked	\N
71499	t	tobechecked	\N
71500	t	tobechecked	\N
71501	t	tobechecked	\N
71502	t	tobechecked	\N
71503	t	tobechecked	\N
71504	t	tobechecked	\N
71505	t	tobechecked	\N
71506	t	tobechecked	\N
71507	t	tobechecked	\N
71508	t	tobechecked	\N
71509	t	tobechecked	\N
71510	t	tobechecked	\N
71511	t	tobechecked	\N
71512	t	tobechecked	\N
71513	t	tobechecked	\N
71514	t	tobechecked	\N
71515	t	tobechecked	\N
71516	t	tobechecked	\N
71517	t	tobechecked	\N
71518	t	tobechecked	\N
71519	t	tobechecked	\N
71520	t	tobechecked	\N
71521	t	tobechecked	\N
71522	t	tobechecked	\N
71523	t	tobechecked	\N
71524	t	tobechecked	\N
71525	t	tobechecked	\N
71526	t	tobechecked	\N
71527	t	tobechecked	\N
71528	t	tobechecked	\N
71529	t	tobechecked	\N
71530	t	tobechecked	\N
71531	t	tobechecked	\N
71532	t	tobechecked	\N
71533	t	tobechecked	\N
71534	t	tobechecked	\N
71535	t	tobechecked	\N
71536	t	tobechecked	\N
71537	t	tobechecked	\N
71538	t	tobechecked	\N
71539	t	tobechecked	\N
71540	t	tobechecked	\N
71541	t	tobechecked	\N
71542	t	tobechecked	\N
71543	t	tobechecked	\N
71544	t	tobechecked	\N
71545	t	tobechecked	\N
71546	t	tobechecked	\N
71547	t	tobechecked	\N
71548	t	tobechecked	\N
71549	t	tobechecked	\N
71550	t	tobechecked	\N
71551	t	tobechecked	\N
71552	t	tobechecked	\N
71553	t	tobechecked	\N
71554	t	tobechecked	\N
71555	t	tobechecked	\N
71556	t	tobechecked	\N
71557	t	tobechecked	\N
71558	t	tobechecked	\N
71559	t	tobechecked	\N
71560	t	tobechecked	\N
71561	t	tobechecked	\N
71562	t	tobechecked	\N
71563	t	tobechecked	\N
71564	t	tobechecked	\N
71565	t	tobechecked	\N
71566	t	tobechecked	\N
71567	t	tobechecked	\N
71568	t	tobechecked	\N
71569	t	tobechecked	\N
71570	t	tobechecked	\N
71571	t	tobechecked	\N
71572	t	tobechecked	\N
71573	t	tobechecked	\N
71574	t	tobechecked	\N
71575	t	tobechecked	\N
71576	t	tobechecked	\N
71577	t	tobechecked	\N
71578	t	tobechecked	\N
71579	t	tobechecked	\N
71580	t	tobechecked	\N
71581	t	tobechecked	\N
71582	t	tobechecked	\N
71583	t	tobechecked	\N
71584	t	tobechecked	\N
71585	t	tobechecked	\N
71586	t	tobechecked	\N
71587	t	tobechecked	\N
71588	t	tobechecked	\N
71589	t	tobechecked	\N
71590	t	tobechecked	\N
71591	t	tobechecked	\N
71592	t	tobechecked	\N
71593	t	tobechecked	\N
71594	t	tobechecked	\N
71595	t	tobechecked	\N
71596	t	tobechecked	\N
71597	t	tobechecked	\N
71598	t	tobechecked	\N
71602	f	tobechecked	\N
71603	t	tobechecked	\N
71604	t	tobechecked	\N
71605	t	tobechecked	\N
71606	t	tobechecked	\N
71607	t	tobechecked	\N
71608	t	tobechecked	\N
71609	t	tobechecked	\N
71610	t	tobechecked	\N
71611	t	tobechecked	\N
71612	t	tobechecked	\N
71613	t	tobechecked	\N
71614	t	tobechecked	\N
71615	t	tobechecked	\N
71616	t	tobechecked	\N
71617	t	tobechecked	\N
71618	t	tobechecked	\N
71619	t	tobechecked	\N
71620	t	tobechecked	\N
71621	f	tobechecked	\N
71622	f	tobechecked	\N
71623	f	tobechecked	\N
71624	f	tobechecked	\N
71625	f	tobechecked	\N
71626	f	tobechecked	\N
71627	f	tobechecked	\N
71628	f	tobechecked	\N
71629	f	tobechecked	\N
71630	f	tobechecked	\N
71631	f	tobechecked	\N
71632	f	tobechecked	\N
71633	f	tobechecked	\N
71634	f	tobechecked	\N
71668	t	tobechecked	\N
71669	t	tobechecked	\N
71670	t	tobechecked	\N
71671	t	tobechecked	\N
71672	t	tobechecked	\N
71673	t	tobechecked	\N
71674	t	tobechecked	\N
71675	t	tobechecked	\N
71676	t	tobechecked	\N
71677	t	tobechecked	\N
71678	t	tobechecked	\N
71679	t	tobechecked	\N
71680	t	tobechecked	\N
71681	t	tobechecked	\N
71682	t	tobechecked	\N
71683	t	tobechecked	\N
71690	t	tobechecked	\N
71691	t	tobechecked	\N
71692	t	tobechecked	\N
71693	t	tobechecked	\N
71694	t	tobechecked	\N
71695	t	tobechecked	\N
71696	t	tobechecked	\N
71697	t	tobechecked	\N
71698	t	tobechecked	\N
71699	t	tobechecked	\N
71700	t	tobechecked	\N
71701	t	tobechecked	\N
71702	t	tobechecked	\N
71703	t	tobechecked	\N
71704	t	tobechecked	\N
71705	t	tobechecked	\N
71706	t	tobechecked	\N
71707	t	tobechecked	\N
71708	t	tobechecked	\N
71709	t	tobechecked	\N
71710	t	tobechecked	\N
71711	t	tobechecked	\N
71712	t	tobechecked	\N
71713	t	tobechecked	\N
71714	t	tobechecked	\N
71715	t	tobechecked	\N
71716	t	tobechecked	\N
71717	t	tobechecked	\N
71718	t	tobechecked	\N
71719	t	tobechecked	\N
71720	t	tobechecked	\N
71721	t	tobechecked	\N
71722	t	tobechecked	\N
71723	t	tobechecked	\N
71724	t	tobechecked	\N
71725	t	tobechecked	\N
71726	t	tobechecked	\N
71727	t	tobechecked	\N
71728	t	tobechecked	\N
71729	t	tobechecked	\N
71730	t	tobechecked	\N
71731	t	tobechecked	\N
71732	t	tobechecked	\N
71733	t	tobechecked	\N
71734	t	tobechecked	\N
71735	t	tobechecked	\N
71736	t	tobechecked	\N
71737	t	tobechecked	\N
71738	t	tobechecked	\N
71739	t	tobechecked	\N
71740	t	tobechecked	\N
71741	t	tobechecked	\N
71742	t	tobechecked	\N
71743	t	tobechecked	\N
71744	t	tobechecked	\N
71745	t	tobechecked	\N
71746	t	tobechecked	\N
71747	t	tobechecked	\N
71748	t	tobechecked	\N
71749	t	tobechecked	\N
71750	t	tobechecked	\N
71751	t	tobechecked	\N
71752	t	tobechecked	\N
71753	t	tobechecked	\N
71754	t	tobechecked	\N
71755	t	tobechecked	\N
71756	t	tobechecked	\N
71757	t	tobechecked	\N
71758	t	tobechecked	\N
71759	t	tobechecked	\N
71760	t	tobechecked	\N
71761	t	tobechecked	\N
71762	t	tobechecked	\N
71763	t	tobechecked	\N
71764	t	tobechecked	\N
71765	t	tobechecked	\N
71766	t	tobechecked	\N
71767	t	tobechecked	\N
71768	t	tobechecked	\N
71769	t	tobechecked	\N
71770	t	tobechecked	\N
71771	t	tobechecked	\N
71772	t	tobechecked	\N
71773	t	tobechecked	\N
71774	t	tobechecked	\N
71775	t	tobechecked	\N
71776	t	tobechecked	\N
71777	t	tobechecked	\N
71778	t	tobechecked	\N
71779	t	tobechecked	\N
71780	t	tobechecked	\N
71781	t	tobechecked	\N
71782	t	tobechecked	\N
71783	t	tobechecked	\N
71784	t	tobechecked	\N
71785	t	tobechecked	\N
71786	t	tobechecked	\N
71787	t	tobechecked	\N
71788	t	tobechecked	\N
71789	t	tobechecked	\N
71790	t	tobechecked	\N
71791	t	tobechecked	\N
71792	t	tobechecked	\N
71793	t	tobechecked	\N
71794	t	tobechecked	\N
71795	t	tobechecked	\N
71796	t	tobechecked	\N
71797	t	tobechecked	\N
71798	t	tobechecked	\N
71799	t	tobechecked	\N
71800	t	tobechecked	\N
71801	t	tobechecked	\N
71802	t	tobechecked	\N
71803	t	tobechecked	\N
71804	t	tobechecked	\N
71805	t	tobechecked	\N
71806	t	tobechecked	\N
71807	t	tobechecked	\N
71808	t	tobechecked	\N
71809	t	tobechecked	\N
71810	t	tobechecked	\N
71811	t	tobechecked	\N
71812	t	tobechecked	\N
71813	t	tobechecked	\N
71814	t	tobechecked	\N
71815	t	tobechecked	\N
71816	t	tobechecked	\N
71817	t	tobechecked	\N
71818	t	tobechecked	\N
71819	t	tobechecked	\N
71820	t	tobechecked	\N
71821	t	tobechecked	\N
71822	t	tobechecked	\N
71823	t	tobechecked	\N
71824	t	tobechecked	\N
71825	t	tobechecked	\N
71826	t	tobechecked	\N
71827	t	tobechecked	\N
71828	t	tobechecked	\N
71829	t	tobechecked	\N
71830	t	tobechecked	\N
71831	t	tobechecked	\N
71832	t	tobechecked	\N
71833	t	tobechecked	\N
71834	t	tobechecked	\N
71835	t	tobechecked	\N
71836	t	tobechecked	\N
71837	t	tobechecked	\N
71838	t	tobechecked	\N
71839	t	tobechecked	\N
71840	t	tobechecked	\N
71841	t	tobechecked	\N
71842	t	tobechecked	\N
71843	t	tobechecked	\N
71844	t	tobechecked	\N
71845	t	tobechecked	\N
71846	t	tobechecked	\N
71847	t	tobechecked	\N
71848	t	tobechecked	\N
71849	t	tobechecked	\N
71850	t	tobechecked	\N
71851	t	tobechecked	\N
71852	t	tobechecked	\N
71853	t	tobechecked	\N
71854	t	tobechecked	\N
71855	t	tobechecked	\N
71856	t	tobechecked	\N
71857	t	tobechecked	\N
71858	t	tobechecked	\N
71859	t	tobechecked	\N
71860	t	tobechecked	\N
71861	t	tobechecked	\N
71862	t	tobechecked	\N
71863	t	tobechecked	\N
71864	t	tobechecked	\N
71865	t	tobechecked	\N
71866	t	tobechecked	\N
71867	t	tobechecked	\N
71868	t	tobechecked	\N
71869	t	tobechecked	\N
71870	t	tobechecked	\N
71871	t	tobechecked	\N
71872	t	tobechecked	\N
71873	t	tobechecked	\N
71874	t	tobechecked	\N
71875	t	tobechecked	\N
71876	t	tobechecked	\N
71877	t	tobechecked	\N
71878	t	tobechecked	\N
71879	t	tobechecked	\N
71880	t	tobechecked	\N
71881	t	tobechecked	\N
71882	t	tobechecked	\N
71883	t	tobechecked	\N
71884	t	tobechecked	\N
71885	t	tobechecked	\N
71886	t	tobechecked	\N
71887	t	tobechecked	\N
71888	t	tobechecked	\N
71889	t	tobechecked	\N
71890	t	tobechecked	\N
71891	t	tobechecked	\N
71892	t	tobechecked	\N
71893	t	tobechecked	\N
71894	t	tobechecked	\N
71895	t	tobechecked	\N
71896	t	tobechecked	\N
71897	t	tobechecked	\N
71898	t	tobechecked	\N
71899	t	tobechecked	\N
71900	t	tobechecked	\N
71901	t	tobechecked	\N
71902	t	tobechecked	\N
71903	t	tobechecked	\N
71904	t	tobechecked	\N
71905	t	tobechecked	\N
71906	t	tobechecked	\N
71907	t	tobechecked	\N
71908	t	tobechecked	\N
71909	t	tobechecked	\N
71910	t	tobechecked	\N
71911	t	tobechecked	\N
71912	t	tobechecked	\N
71913	t	tobechecked	\N
71914	t	tobechecked	\N
71915	t	tobechecked	\N
71916	t	tobechecked	\N
71917	t	tobechecked	\N
71918	t	tobechecked	\N
71919	t	tobechecked	\N
71920	t	tobechecked	\N
71921	t	tobechecked	\N
71935	t	tobechecked	\N
71937	t	tobechecked	\N
71952	t	tobechecked	\N
71954	t	tobechecked	\N
72006	t	tobechecked	\N
72042	t	tobechecked	\N
72044	t	tobechecked	\N
72046	t	tobechecked	\N
72047	t	tobechecked	\N
72054	t	tobechecked	\N
72058	t	tobechecked	\N
72063	t	tobechecked	\N
72064	t	tobechecked	\N
72073	t	tobechecked	\N
72074	t	tobechecked	\N
72077	t	tobechecked	\N
72083	t	tobechecked	\N
72085	f	tobechecked	\N
72086	t	tobechecked	\N
72087	t	tobechecked	\N
72091	f	tobechecked	\N
72097	t	tobechecked	\N
72098	t	tobechecked	\N
72110	f	tobechecked	2027-05-03 00:00:00
72111	f	tobechecked	\N
72112	f	tobechecked	\N
72114	f	tobechecked	\N
72115	f	tobechecked	\N
72117	f	tobechecked	\N
72120	f	tobechecked	\N
72124	t	tobechecked	\N
72182	f	tobechecked	\N
72204	t	tobechecked	\N
72207	t	tobechecked	\N
72209	t	tobechecked	\N
72218	t	tobechecked	\N
72237	t	tobechecked	\N
72238	t	tobechecked	\N
72239	t	tobechecked	\N
72240	t	tobechecked	\N
72241	t	tobechecked	\N
72248	t	tobechecked	\N
72249	t	tobechecked	\N
72250	t	tobechecked	\N
72283	t	tobechecked	\N
72284	t	tobechecked	\N
72285	t	tobechecked	\N
72286	t	tobechecked	\N
72297	t	tobechecked	\N
72305	f	tobechecked	\N
72308	f	tobechecked	\N
72320	t	tobechecked	\N
72327	t	tobechecked	\N
72330	t	tobechecked	\N
72331	t	tobechecked	\N
72332	f	tobechecked	\N
72333	t	tobechecked	\N
72335	t	tobechecked	\N
72341	t	tobechecked	\N
72342	f	tobechecked	\N
72358	t	tobechecked	\N
72359	t	tobechecked	\N
72360	f	tobechecked	\N
72361	t	tobechecked	\N
72362	t	tobechecked	\N
72363	t	tobechecked	\N
72364	t	tobechecked	\N
72365	t	tobechecked	\N
72366	t	tobechecked	\N
72367	t	tobechecked	\N
72368	t	tobechecked	\N
72369	t	tobechecked	\N
72370	t	tobechecked	\N
72371	t	tobechecked	\N
72372	t	tobechecked	\N
72410	t	tobechecked	\N
72411	t	tobechecked	\N
72414	t	tobechecked	\N
72416	f	tobechecked	2026-01-17 00:00:00
72417	f	tobechecked	2025-11-17 00:00:00
72418	f	tobechecked	2024-02-03 00:00:00
72419	f	tobechecked	2025-02-02 00:00:00
72426	t	tobechecked	\N
72440	t	tobechecked	\N
72441	t	tobechecked	\N
72442	t	tobechecked	\N
72443	t	tobechecked	\N
72444	t	tobechecked	\N
72445	t	tobechecked	\N
72446	t	tobechecked	\N
72472	t	tobechecked	\N
72493	f	tobechecked	\N
72495	f	tobechecked	\N
72496	f	tobechecked	\N
72508	f	tobechecked	\N
72517	t	tobechecked	\N
72518	t	tobechecked	\N
72519	t	tobechecked	\N
72520	t	tobechecked	\N
72521	t	tobechecked	\N
72522	t	tobechecked	\N
72523	t	tobechecked	\N
72524	t	tobechecked	\N
72525	t	tobechecked	\N
72526	t	tobechecked	\N
72527	t	tobechecked	\N
72528	t	tobechecked	\N
72529	t	tobechecked	\N
72530	t	tobechecked	\N
72531	t	tobechecked	\N
72532	t	tobechecked	\N
72533	t	tobechecked	\N
72534	t	tobechecked	\N
72535	t	tobechecked	\N
72536	t	tobechecked	\N
72537	t	tobechecked	\N
72538	t	tobechecked	\N
72539	t	tobechecked	\N
72540	t	tobechecked	\N
72541	t	tobechecked	\N
72542	t	tobechecked	\N
72543	t	tobechecked	\N
72544	t	tobechecked	\N
72545	t	tobechecked	\N
72546	t	tobechecked	\N
72547	t	tobechecked	\N
72548	t	tobechecked	\N
72549	t	tobechecked	\N
72550	t	tobechecked	\N
72551	t	tobechecked	\N
72552	t	tobechecked	\N
72553	t	tobechecked	\N
72554	t	tobechecked	\N
72555	t	tobechecked	\N
72556	t	tobechecked	\N
72557	t	tobechecked	\N
72558	t	tobechecked	\N
72559	t	tobechecked	\N
72560	t	tobechecked	\N
72561	t	tobechecked	\N
72562	t	tobechecked	\N
72563	t	tobechecked	\N
72564	t	tobechecked	\N
72565	t	tobechecked	\N
72566	t	tobechecked	\N
72567	t	tobechecked	\N
72568	t	tobechecked	\N
72569	t	tobechecked	\N
72570	t	tobechecked	\N
72571	t	tobechecked	\N
72572	t	tobechecked	\N
72573	t	tobechecked	\N
72574	t	tobechecked	\N
72575	t	tobechecked	\N
72576	t	tobechecked	\N
72577	t	tobechecked	\N
72587	f	tobechecked	\N
72596	t	tobechecked	\N
72600	f	tobechecked	\N
72603	t	tobechecked	\N
72610	t	tobechecked	\N
72611	t	tobechecked	\N
72614	f	tobechecked	\N
72618	t	tobechecked	\N
72619	t	tobechecked	\N
72620	t	tobechecked	\N
72621	t	tobechecked	\N
72622	t	tobechecked	\N
72624	t	tobechecked	\N
72630	t	tobechecked	\N
72631	t	tobechecked	\N
72632	f	tobechecked	\N
72633	f	tobechecked	\N
72634	f	tobechecked	\N
72635	f	tobechecked	\N
72636	f	tobechecked	\N
72637	f	tobechecked	\N
72655	f	tobechecked	2026-10-31 00:00:00
72656	f	tobechecked	2024-11-25 00:00:00
72657	f	tobechecked	2026-11-16 00:00:00
72658	f	tobechecked	2025-01-28 00:00:00
72678	t	tobechecked	\N
72679	t	tobechecked	\N
72680	t	tobechecked	\N
72681	t	tobechecked	\N
72682	f	tobechecked	\N
72683	f	tobechecked	\N
72684	f	tobechecked	\N
72685	f	tobechecked	\N
72686	f	tobechecked	\N
72687	f	tobechecked	\N
72688	t	tobechecked	\N
72689	t	tobechecked	\N
72690	t	tobechecked	\N
72691	t	tobechecked	\N
72692	t	tobechecked	\N
72693	t	tobechecked	\N
72694	t	tobechecked	\N
72695	t	tobechecked	\N
72696	t	tobechecked	\N
72697	t	tobechecked	\N
72698	f	tobechecked	\N
72699	t	tobechecked	\N
72700	t	tobechecked	\N
72701	t	tobechecked	\N
72702	t	tobechecked	\N
72703	t	tobechecked	\N
72704	t	tobechecked	\N
72705	t	tobechecked	\N
72706	t	tobechecked	\N
72707	t	tobechecked	\N
72708	t	tobechecked	\N
72709	t	tobechecked	\N
72710	t	tobechecked	\N
72711	t	tobechecked	\N
72712	t	tobechecked	\N
72713	t	tobechecked	\N
72714	t	tobechecked	\N
72715	t	tobechecked	\N
72716	t	tobechecked	\N
72717	t	tobechecked	\N
72718	t	tobechecked	\N
72719	t	tobechecked	\N
72720	t	tobechecked	\N
72721	t	tobechecked	\N
72727	t	tobechecked	\N
72736	t	tobechecked	\N
72739	t	tobechecked	\N
72740	t	tobechecked	\N
72798	t	tobechecked	\N
72804	t	tobechecked	\N
72809	t	tobechecked	\N
72829	t	tobechecked	\N
72830	t	tobechecked	\N
72831	t	tobechecked	\N
72832	t	tobechecked	\N
72833	t	tobechecked	\N
72834	t	tobechecked	\N
72835	t	tobechecked	\N
72836	t	tobechecked	\N
72837	t	tobechecked	\N
72839	t	tobechecked	\N
72840	t	tobechecked	\N
72841	t	tobechecked	\N
72842	t	tobechecked	\N
72843	t	tobechecked	\N
72844	t	tobechecked	\N
72845	t	tobechecked	\N
72861	t	tobechecked	\N
72905	f	tobechecked	\N
72914	t	tobechecked	\N
72916	t	tobechecked	\N
72918	t	tobechecked	\N
72921	t	tobechecked	\N
72922	t	tobechecked	\N
72923	t	tobechecked	\N
72944	t	tobechecked	\N
72948	t	tobechecked	\N
72986	f	tobechecked	\N
72987	f	tobechecked	\N
72988	f	tobechecked	\N
72992	f	tobechecked	\N
72993	f	tobechecked	\N
72994	f	tobechecked	\N
72995	f	tobechecked	2026-12-19 00:00:00
72996	f	tobechecked	2027-07-12 00:00:00
72997	f	tobechecked	2027-06-17 00:00:00
72998	f	tobechecked	2025-10-27 00:00:00
72999	f	tobechecked	2025-10-27 00:00:00
73000	f	tobechecked	2026-03-09 00:00:00
73001	f	tobechecked	2026-06-19 00:00:00
73002	f	tobechecked	2026-07-04 00:00:00
73003	f	tobechecked	2026-12-13 00:00:00
73004	f	tobechecked	2027-07-12 00:00:00
73005	f	tobechecked	2027-07-12 00:00:00
73006	f	tobechecked	2029-04-28 00:00:00
73007	f	tobechecked	2026-03-09 00:00:00
73008	f	tobechecked	2025-12-12 00:00:00
73009	f	tobechecked	2026-05-18 00:00:00
73010	f	tobechecked	2027-04-30 00:00:00
73011	f	tobechecked	2026-01-25 00:00:00
73012	f	tobechecked	2028-01-15 00:00:00
73016	t	tobechecked	\N
103745	t	tobechecked	\N
103800	t	tobechecked	\N
103802	t	tobechecked	\N
103822	t	tobechecked	\N
103824	t	tobechecked	\N
103828	t	tobechecked	\N
103830	t	tobechecked	\N
103832	t	tobechecked	\N
103838	t	tobechecked	\N
103840	t	tobechecked	\N
103842	t	tobechecked	\N
103844	t	tobechecked	\N
103846	t	tobechecked	\N
103850	t	tobechecked	\N
103854	t	tobechecked	\N
103856	t	tobechecked	\N
103858	t	tobechecked	\N
103860	t	tobechecked	\N
103862	t	tobechecked	\N
103864	t	tobechecked	\N
103866	t	tobechecked	\N
103874	t	tobechecked	\N
103876	t	tobechecked	\N
103880	t	tobechecked	\N
103882	t	tobechecked	\N
103884	t	tobechecked	\N
103886	t	tobechecked	\N
103894	t	tobechecked	\N
103914	t	tobechecked	\N
103916	t	tobechecked	\N
103918	t	tobechecked	\N
103920	t	tobechecked	\N
103922	t	tobechecked	\N
103924	t	tobechecked	\N
103926	t	tobechecked	\N
103938	t	tobechecked	\N
103942	t	tobechecked	\N
103944	t	tobechecked	\N
103948	t	tobechecked	\N
103970	f	tobechecked	\N
103972	t	tobechecked	\N
103974	t	tobechecked	\N
103976	t	tobechecked	\N
103978	t	tobechecked	\N
103980	t	tobechecked	\N
103982	t	tobechecked	\N
103984	t	tobechecked	\N
103986	t	tobechecked	\N
103988	t	tobechecked	\N
103990	t	tobechecked	\N
103992	t	tobechecked	\N
103994	t	tobechecked	\N
103996	t	tobechecked	\N
103998	t	tobechecked	\N
104000	t	tobechecked	\N
104010	t	tobechecked	\N
104024	t	tobechecked	\N
104026	t	tobechecked	\N
104028	t	tobechecked	\N
104038	t	tobechecked	\N
104070	t	tobechecked	\N
104072	f	tobechecked	\N
104074	t	tobechecked	\N
104086	t	tobechecked	\N
104094	t	tobechecked	\N
104116	t	tobechecked	\N
104130	t	tobechecked	\N
104132	t	tobechecked	\N
104156	t	tobechecked	\N
104184	t	tobechecked	\N
104200	f	tobechecked	\N
104258	f	tobechecked	\N
104268	f	tobechecked	\N
104270	f	tobechecked	\N
104272	t	tobechecked	\N
104274	t	tobechecked	\N
104278	t	tobechecked	\N
104280	t	tobechecked	\N
104292	t	tobechecked	\N
104374	t	tobechecked	\N
104404	t	tobechecked	\N
104406	t	tobechecked	\N
104428	t	tobechecked	\N
104430	t	tobechecked	\N
104432	t	tobechecked	\N
104438	t	tobechecked	\N
104510	f	tobechecked	\N
104512	f	tobechecked	\N
104514	f	tobechecked	\N
104516	f	tobechecked	\N
104530	f	tobechecked	\N
104532	f	tobechecked	\N
104540	t	tobechecked	\N
104586	t	tobechecked	\N
104600	f	tobechecked	\N
104614	t	tobechecked	\N
104618	f	tobechecked	\N
104620	f	tobechecked	\N
104622	f	tobechecked	\N
104624	f	tobechecked	\N
104626	f	tobechecked	\N
104628	f	tobechecked	\N
104630	f	tobechecked	\N
104632	f	tobechecked	\N
104634	f	tobechecked	\N
103764	t	tobechecked	\N
103762	t	tobechecked	\N
103788	t	tobechecked	\N
103790	t	tobechecked	\N
103733	f	tobechecked	\N
103798	t	tobechecked	\N
103796	t	tobechecked	\N
104636	f	tobechecked	\N
104638	f	tobechecked	\N
104640	f	tobechecked	\N
104642	f	tobechecked	\N
104644	f	tobechecked	\N
104646	f	tobechecked	\N
104648	f	tobechecked	\N
104650	f	tobechecked	\N
104652	f	tobechecked	\N
104654	t	tobechecked	\N
104656	t	tobechecked	\N
104658	t	tobechecked	\N
104660	f	tobechecked	\N
104662	t	tobechecked	\N
104664	t	tobechecked	\N
104666	t	tobechecked	\N
104668	t	tobechecked	\N
104670	t	tobechecked	\N
104672	t	tobechecked	\N
104674	t	tobechecked	\N
104676	t	tobechecked	\N
104678	t	tobechecked	\N
104680	t	tobechecked	\N
104682	t	tobechecked	\N
104684	t	tobechecked	\N
104686	t	tobechecked	\N
104688	t	tobechecked	\N
104690	f	tobechecked	\N
104692	f	tobechecked	\N
104694	t	tobechecked	\N
104696	t	tobechecked	\N
104698	t	tobechecked	\N
104700	t	tobechecked	\N
104702	t	tobechecked	\N
104704	t	tobechecked	\N
104706	t	tobechecked	\N
104708	t	tobechecked	\N
104710	f	tobechecked	\N
104712	t	tobechecked	\N
104714	t	tobechecked	\N
104716	t	tobechecked	\N
104718	t	tobechecked	\N
104720	t	tobechecked	\N
104722	f	tobechecked	\N
104724	f	tobechecked	\N
104726	t	tobechecked	\N
104728	t	tobechecked	\N
104730	t	tobechecked	\N
104732	t	tobechecked	\N
104734	f	tobechecked	\N
104736	f	tobechecked	\N
104738	t	tobechecked	\N
104740	t	tobechecked	\N
104742	f	tobechecked	\N
104746	t	tobechecked	\N
104748	f	tobechecked	\N
104750	t	tobechecked	\N
104756	t	tobechecked	\N
104778	t	tobechecked	\N
104780	t	tobechecked	\N
104785	t	tobechecked	\N
104818	t	tobechecked	\N
104839	t	tobechecked	\N
104851	t	tobechecked	\N
113278	f	tobechecked	\N
113281	t	tobechecked	\N
113282	t	tobechecked	\N
113283	t	tobechecked	\N
113289	t	tobechecked	\N
113291	t	tobechecked	\N
113297	t	tobechecked	\N
113298	t	tobechecked	\N
113299	t	tobechecked	\N
113300	t	tobechecked	\N
113301	t	tobechecked	\N
113302	t	tobechecked	\N
113303	t	tobechecked	\N
113304	t	tobechecked	\N
113305	t	tobechecked	\N
113306	t	tobechecked	\N
113307	t	tobechecked	\N
113308	t	tobechecked	\N
113309	t	tobechecked	\N
113310	t	tobechecked	\N
113313	t	tobechecked	\N
113314	t	tobechecked	\N
113316	t	tobechecked	\N
113317	t	tobechecked	\N
113318	t	tobechecked	\N
113319	t	tobechecked	\N
113320	t	tobechecked	\N
113321	t	tobechecked	\N
113322	t	tobechecked	\N
113323	t	tobechecked	\N
113324	t	tobechecked	\N
113325	t	tobechecked	\N
113326	t	tobechecked	\N
113327	t	tobechecked	\N
113328	t	tobechecked	\N
113329	t	tobechecked	\N
113330	t	tobechecked	\N
113331	t	tobechecked	\N
113332	t	tobechecked	\N
113333	t	tobechecked	\N
113334	t	tobechecked	\N
113335	t	tobechecked	\N
113336	t	tobechecked	\N
113337	t	tobechecked	\N
113341	t	tobechecked	\N
113342	t	tobechecked	\N
113343	t	tobechecked	\N
113352	t	tobechecked	\N
113353	t	tobechecked	\N
113354	t	tobechecked	\N
113356	t	tobechecked	\N
113360	t	tobechecked	\N
113361	t	tobechecked	\N
113362	t	tobechecked	\N
113363	t	tobechecked	\N
113364	t	tobechecked	\N
113365	t	tobechecked	\N
113368	t	tobechecked	\N
113382	f	tobechecked	\N
113384	t	tobechecked	\N
113385	t	tobechecked	\N
113386	t	tobechecked	\N
113387	t	tobechecked	\N
113388	t	tobechecked	\N
113389	t	tobechecked	\N
113390	t	tobechecked	\N
113391	t	tobechecked	\N
113392	t	tobechecked	\N
113393	t	tobechecked	\N
113394	t	tobechecked	\N
113395	t	tobechecked	\N
113396	f	tobechecked	\N
113397	f	tobechecked	\N
113398	t	tobechecked	\N
113399	t	tobechecked	\N
113400	t	tobechecked	\N
113401	t	tobechecked	\N
113402	t	tobechecked	\N
113403	t	tobechecked	\N
113404	t	tobechecked	\N
113405	t	tobechecked	\N
113406	t	tobechecked	\N
113407	t	tobechecked	\N
113408	t	tobechecked	\N
113409	t	tobechecked	\N
113410	t	tobechecked	\N
113411	t	tobechecked	\N
113412	t	tobechecked	\N
113275	t	approved	\N
113279	t	tobechecked	\N
113277	t	tobechecked	\N
113415	f	tobechecked	\N
113416	t	tobechecked	\N
113417	t	tobechecked	\N
113418	f	tobechecked	\N
113419	t	tobechecked	\N
113420	t	tobechecked	\N
113421	t	tobechecked	\N
113422	t	tobechecked	\N
113423	t	tobechecked	\N
113424	t	tobechecked	\N
113425	t	tobechecked	\N
113426	t	tobechecked	\N
113427	f	tobechecked	\N
113428	t	tobechecked	\N
113429	f	tobechecked	\N
113430	t	tobechecked	\N
113431	f	tobechecked	\N
113432	f	tobechecked	\N
113433	t	tobechecked	\N
113434	t	tobechecked	\N
113435	t	tobechecked	\N
113436	t	tobechecked	\N
113437	t	tobechecked	\N
113438	t	tobechecked	\N
113439	t	tobechecked	\N
113440	t	tobechecked	\N
113441	t	tobechecked	\N
113442	t	tobechecked	\N
113443	t	tobechecked	\N
113444	t	tobechecked	\N
113445	t	tobechecked	\N
113446	t	tobechecked	\N
113447	t	tobechecked	\N
113448	t	tobechecked	\N
113449	t	tobechecked	\N
113450	t	tobechecked	\N
113451	t	tobechecked	\N
113452	t	tobechecked	\N
113453	t	tobechecked	\N
113454	f	tobechecked	\N
113455	t	tobechecked	\N
113456	t	tobechecked	\N
113457	t	tobechecked	\N
113458	t	tobechecked	\N
113459	t	tobechecked	\N
113460	t	tobechecked	\N
113461	t	tobechecked	\N
113462	t	tobechecked	\N
113463	t	tobechecked	\N
113464	t	tobechecked	\N
113465	t	tobechecked	\N
113466	f	tobechecked	\N
113467	t	tobechecked	\N
113468	t	tobechecked	\N
113469	t	tobechecked	\N
113470	t	tobechecked	\N
113471	t	tobechecked	\N
113472	t	tobechecked	\N
113473	t	tobechecked	\N
113474	t	tobechecked	\N
113475	t	tobechecked	\N
113476	t	tobechecked	\N
113477	t	tobechecked	\N
113478	t	tobechecked	\N
113479	t	tobechecked	\N
113480	t	tobechecked	\N
113481	t	tobechecked	\N
113482	t	tobechecked	\N
113483	t	tobechecked	\N
113484	t	tobechecked	\N
113485	t	tobechecked	\N
113486	t	tobechecked	\N
113487	t	tobechecked	\N
113488	t	tobechecked	\N
113489	t	tobechecked	\N
113490	t	tobechecked	\N
113491	t	tobechecked	\N
113492	t	tobechecked	\N
113493	t	tobechecked	\N
113500	t	tobechecked	\N
113501	t	tobechecked	\N
113502	t	tobechecked	\N
113503	t	tobechecked	\N
113504	t	tobechecked	\N
113505	t	tobechecked	\N
113506	t	tobechecked	\N
113507	f	tobechecked	\N
113508	t	tobechecked	\N
113509	t	tobechecked	\N
113510	t	tobechecked	\N
113511	t	tobechecked	\N
113512	t	tobechecked	\N
113513	t	tobechecked	\N
113514	t	tobechecked	\N
113515	t	tobechecked	\N
113516	t	tobechecked	\N
113517	t	tobechecked	\N
113518	t	tobechecked	\N
113519	t	tobechecked	\N
113520	t	tobechecked	\N
113521	t	tobechecked	\N
113524	t	tobechecked	\N
113525	t	tobechecked	\N
113526	t	tobechecked	\N
113527	t	tobechecked	\N
113528	t	tobechecked	\N
113529	t	tobechecked	\N
113530	t	tobechecked	\N
113531	t	tobechecked	\N
113532	t	tobechecked	\N
113533	t	tobechecked	\N
113534	t	tobechecked	\N
113535	t	tobechecked	\N
113536	t	tobechecked	\N
113537	t	tobechecked	\N
113538	t	tobechecked	\N
113539	t	tobechecked	\N
113540	t	tobechecked	\N
113541	t	tobechecked	\N
113542	t	tobechecked	\N
113543	t	tobechecked	\N
113544	f	tobechecked	\N
113549	t	tobechecked	\N
113550	t	tobechecked	\N
113551	t	tobechecked	\N
113552	t	tobechecked	\N
113553	t	tobechecked	\N
113554	t	tobechecked	\N
113555	t	tobechecked	\N
113556	t	tobechecked	\N
113557	t	tobechecked	\N
113558	t	tobechecked	\N
113559	t	tobechecked	\N
113560	t	tobechecked	\N
113561	t	tobechecked	\N
113562	t	tobechecked	\N
113563	t	tobechecked	\N
113564	f	tobechecked	\N
113565	f	tobechecked	\N
113566	f	tobechecked	\N
113567	f	tobechecked	\N
113568	f	tobechecked	\N
113569	f	tobechecked	\N
113570	t	tobechecked	\N
113571	t	tobechecked	\N
113578	t	tobechecked	\N
113579	t	tobechecked	\N
113580	t	tobechecked	\N
113581	t	tobechecked	\N
113582	t	tobechecked	\N
113583	t	tobechecked	\N
113584	t	tobechecked	\N
113585	t	tobechecked	\N
113586	t	tobechecked	\N
113587	t	tobechecked	\N
113588	t	tobechecked	\N
113589	t	tobechecked	\N
113590	t	tobechecked	\N
113591	t	tobechecked	\N
113592	t	tobechecked	\N
113593	t	tobechecked	\N
113594	t	tobechecked	\N
113595	t	tobechecked	\N
113596	t	tobechecked	\N
113597	t	tobechecked	\N
113598	t	tobechecked	\N
113599	t	tobechecked	\N
113600	t	tobechecked	\N
113601	t	tobechecked	\N
113602	t	tobechecked	\N
113603	t	tobechecked	\N
113604	t	tobechecked	\N
113605	t	tobechecked	\N
113606	t	tobechecked	\N
113607	t	tobechecked	\N
113608	t	tobechecked	\N
113609	t	tobechecked	\N
113610	t	tobechecked	\N
113611	t	tobechecked	\N
113612	t	tobechecked	\N
113613	t	tobechecked	\N
113614	t	tobechecked	\N
113615	t	tobechecked	\N
113616	t	tobechecked	\N
113617	t	tobechecked	\N
113618	t	tobechecked	\N
113619	t	tobechecked	\N
113620	t	tobechecked	\N
113621	t	tobechecked	\N
113622	t	tobechecked	\N
113623	t	tobechecked	\N
113624	t	tobechecked	\N
113625	t	tobechecked	\N
113626	t	tobechecked	\N
113627	t	tobechecked	\N
113628	t	tobechecked	\N
113629	t	tobechecked	\N
113630	t	tobechecked	\N
113631	t	tobechecked	\N
113632	t	tobechecked	\N
113633	t	tobechecked	\N
113634	t	tobechecked	\N
113635	t	tobechecked	\N
113636	t	tobechecked	\N
113637	t	tobechecked	\N
113638	t	tobechecked	\N
113639	t	tobechecked	\N
113640	t	tobechecked	\N
113641	t	tobechecked	\N
113642	t	tobechecked	\N
113643	t	tobechecked	\N
113644	t	tobechecked	\N
113645	t	tobechecked	\N
113646	t	tobechecked	\N
113647	t	tobechecked	\N
113648	t	tobechecked	\N
113649	t	tobechecked	\N
113650	t	tobechecked	\N
113651	t	tobechecked	\N
113652	t	tobechecked	\N
113653	t	tobechecked	\N
113654	t	tobechecked	\N
113655	t	tobechecked	\N
113656	t	tobechecked	\N
113657	t	tobechecked	\N
113658	t	tobechecked	\N
113659	t	tobechecked	\N
113660	t	tobechecked	\N
113661	t	tobechecked	\N
113662	t	tobechecked	\N
113663	t	tobechecked	\N
113664	t	tobechecked	\N
113665	t	tobechecked	\N
113666	t	tobechecked	\N
113667	t	tobechecked	\N
113668	t	tobechecked	\N
113669	t	tobechecked	\N
113670	t	tobechecked	\N
113671	t	tobechecked	\N
113672	t	tobechecked	\N
113673	t	tobechecked	\N
113674	t	tobechecked	\N
113675	t	tobechecked	\N
113676	t	tobechecked	\N
113677	t	tobechecked	\N
113678	t	tobechecked	\N
113679	t	tobechecked	\N
113680	t	tobechecked	\N
113681	t	tobechecked	\N
113682	t	tobechecked	\N
113683	t	tobechecked	\N
113684	t	tobechecked	\N
113685	t	tobechecked	\N
113686	t	tobechecked	\N
113687	t	tobechecked	\N
113688	t	tobechecked	\N
113689	t	tobechecked	\N
113690	t	tobechecked	\N
113691	t	tobechecked	\N
113692	t	tobechecked	\N
113693	t	tobechecked	\N
113694	t	tobechecked	\N
113695	f	tobechecked	\N
113697	t	tobechecked	\N
113698	t	tobechecked	\N
113699	t	tobechecked	\N
113700	t	tobechecked	\N
113701	t	tobechecked	\N
113702	t	tobechecked	\N
113703	t	tobechecked	\N
113704	t	tobechecked	\N
113705	t	tobechecked	\N
113706	t	tobechecked	\N
113707	t	tobechecked	\N
113708	t	tobechecked	\N
113709	t	tobechecked	\N
113710	t	tobechecked	\N
113711	t	tobechecked	\N
113712	t	tobechecked	\N
113713	t	tobechecked	\N
113714	t	tobechecked	\N
113715	t	tobechecked	\N
113716	t	tobechecked	\N
113717	t	tobechecked	\N
113718	t	tobechecked	\N
113719	t	tobechecked	\N
113720	t	tobechecked	\N
113721	t	tobechecked	\N
113722	t	tobechecked	\N
113723	t	tobechecked	\N
113724	t	tobechecked	\N
113725	t	tobechecked	\N
113726	t	tobechecked	\N
113727	t	tobechecked	\N
113728	t	tobechecked	\N
113729	t	tobechecked	\N
113730	t	tobechecked	\N
113731	t	tobechecked	\N
113732	t	tobechecked	\N
113733	t	tobechecked	\N
113734	t	tobechecked	\N
113735	t	tobechecked	\N
113736	t	tobechecked	\N
113737	t	tobechecked	\N
113738	t	tobechecked	\N
113739	t	tobechecked	\N
113740	t	tobechecked	\N
113741	t	tobechecked	\N
113742	t	tobechecked	\N
113743	t	tobechecked	\N
113744	t	tobechecked	\N
113745	t	tobechecked	\N
113746	t	tobechecked	\N
113747	t	tobechecked	\N
113748	t	tobechecked	\N
113749	t	tobechecked	\N
113750	t	tobechecked	\N
113751	t	tobechecked	\N
113752	t	tobechecked	\N
113753	t	tobechecked	\N
113754	t	tobechecked	\N
113755	t	tobechecked	\N
113756	t	tobechecked	\N
113757	t	tobechecked	\N
113758	t	tobechecked	\N
113759	t	tobechecked	\N
113760	t	tobechecked	\N
113761	t	tobechecked	\N
113762	t	tobechecked	\N
113763	t	tobechecked	\N
113764	t	tobechecked	\N
113765	t	tobechecked	\N
113766	t	tobechecked	\N
113767	t	tobechecked	\N
113768	t	tobechecked	\N
113769	t	tobechecked	\N
113770	t	tobechecked	\N
113781	t	tobechecked	\N
113782	t	tobechecked	\N
113784	f	tobechecked	\N
113785	t	tobechecked	\N
113817	f	tobechecked	\N
113842	t	tobechecked	\N
113852	f	tobechecked	\N
113853	f	tobechecked	\N
113857	f	tobechecked	\N
113865	f	tobechecked	\N
113881	f	tobechecked	\N
113926	f	tobechecked	\N
113930	f	tobechecked	\N
113956	f	tobechecked	\N
113980	t	tobechecked	\N
113981	f	tobechecked	\N
114007	t	tobechecked	\N
114008	t	tobechecked	\N
114009	t	tobechecked	\N
114033	f	tobechecked	\N
114049	t	tobechecked	\N
114050	t	tobechecked	\N
114051	f	tobechecked	\N
114056	f	tobechecked	\N
114057	f	tobechecked	\N
114086	t	tobechecked	\N
114105	f	tobechecked	\N
114116	f	tobechecked	\N
114117	f	tobechecked	\N
114118	f	tobechecked	\N
114122	f	tobechecked	2024-12-31 00:00:00
114123	f	tobechecked	2024-12-31 00:00:00
114124	f	tobechecked	2024-12-31 00:00:00
114125	f	tobechecked	2024-12-31 00:00:00
114126	f	tobechecked	2024-12-31 00:00:00
114127	f	tobechecked	2024-12-31 00:00:00
114128	f	tobechecked	2024-12-31 00:00:00
114129	f	tobechecked	2024-12-31 00:00:00
114130	f	tobechecked	2024-12-31 00:00:00
114131	f	tobechecked	2024-12-31 00:00:00
114137	f	tobechecked	\N
114161	t	tobechecked	\N
114165	f	tobechecked	\N
114276	t	tobechecked	\N
114277	t	tobechecked	\N
114278	t	tobechecked	\N
114279	t	tobechecked	\N
114280	t	tobechecked	\N
114281	t	tobechecked	\N
114282	t	tobechecked	\N
114283	t	tobechecked	\N
114284	t	tobechecked	\N
114285	t	tobechecked	\N
114286	t	tobechecked	\N
114305	t	tobechecked	\N
114316	t	tobechecked	\N
114325	t	tobechecked	\N
114326	t	tobechecked	\N
114328	t	tobechecked	\N
114329	t	tobechecked	\N
114334	t	tobechecked	\N
114336	f	tobechecked	\N
114337	f	tobechecked	\N
114338	f	tobechecked	\N
114339	f	tobechecked	\N
114340	f	tobechecked	\N
114341	t	tobechecked	\N
114342	t	tobechecked	\N
114343	t	tobechecked	\N
114344	t	tobechecked	\N
114345	t	tobechecked	\N
114346	t	tobechecked	\N
114347	t	tobechecked	\N
114348	t	tobechecked	\N
114349	t	tobechecked	\N
114350	t	tobechecked	\N
114351	t	tobechecked	\N
114352	t	tobechecked	\N
114353	t	tobechecked	\N
114354	t	tobechecked	\N
114355	t	tobechecked	\N
114356	t	tobechecked	\N
114357	t	tobechecked	\N
114358	f	tobechecked	\N
114359	t	tobechecked	\N
114360	t	tobechecked	\N
114361	t	tobechecked	\N
114362	t	tobechecked	\N
114363	t	tobechecked	\N
114364	t	tobechecked	\N
114365	t	tobechecked	\N
114404	t	tobechecked	\N
114415	f	tobechecked	\N
114427	f	tobechecked	\N
114430	f	tobechecked	\N
114433	f	tobechecked	\N
114437	t	tobechecked	\N
114446	f	tobechecked	\N
114453	f	tobechecked	\N
114454	f	tobechecked	\N
114455	f	tobechecked	\N
114456	f	tobechecked	\N
114460	t	tobechecked	\N
114461	f	tobechecked	\N
114464	f	tobechecked	\N
114465	f	tobechecked	\N
114466	t	tobechecked	\N
114467	t	tobechecked	\N
114468	t	tobechecked	\N
114469	t	tobechecked	\N
114471	t	tobechecked	\N
114472	t	tobechecked	\N
114476	f	tobechecked	\N
114477	f	tobechecked	\N
114478	f	tobechecked	\N
114479	f	tobechecked	\N
114481	t	tobechecked	\N
114483	t	tobechecked	\N
114484	f	tobechecked	\N
114485	f	tobechecked	\N
114486	f	tobechecked	\N
114508	t	tobechecked	\N
114509	t	tobechecked	\N
114574	f	tobechecked	\N
114591	f	tobechecked	\N
114607	t	tobechecked	\N
114613	f	tobechecked	\N
114617	t	tobechecked	\N
114619	t	tobechecked	\N
114620	t	tobechecked	\N
114633	t	tobechecked	\N
114701	f	tobechecked	\N
114706	f	tobechecked	\N
114716	f	tobechecked	\N
114719	f	tobechecked	\N
114721	t	tobechecked	\N
114722	t	tobechecked	\N
114724	f	tobechecked	\N
114731	t	tobechecked	\N
114733	t	tobechecked	\N
114737	t	tobechecked	\N
114755	t	tobechecked	\N
114756	t	tobechecked	\N
114757	t	tobechecked	\N
114778	t	tobechecked	\N
114786	t	tobechecked	\N
114792	t	tobechecked	\N
114796	t	tobechecked	\N
114797	t	tobechecked	\N
114798	t	tobechecked	\N
114799	t	tobechecked	\N
114800	t	tobechecked	\N
114809	t	tobechecked	\N
114810	t	tobechecked	\N
114811	t	tobechecked	\N
114818	f	tobechecked	\N
114826	t	tobechecked	\N
114847	t	tobechecked	\N
114848	t	tobechecked	\N
114851	t	tobechecked	\N
114856	t	tobechecked	\N
114869	t	tobechecked	\N
114877	t	tobechecked	\N
114878	t	tobechecked	\N
114883	f	tobechecked	\N
114884	f	tobechecked	\N
114885	f	tobechecked	\N
114894	f	tobechecked	\N
114895	f	tobechecked	\N
114897	f	tobechecked	\N
114901	f	tobechecked	\N
114935	t	tobechecked	\N
114937	t	tobechecked	\N
114946	t	tobechecked	\N
114950	t	tobechecked	\N
114952	t	tobechecked	\N
114955	t	tobechecked	\N
114956	t	tobechecked	\N
114957	t	tobechecked	\N
114958	t	tobechecked	\N
114962	t	tobechecked	\N
114967	t	tobechecked	\N
114971	t	tobechecked	\N
114991	t	tobechecked	\N
115012	t	tobechecked	\N
115014	t	tobechecked	\N
115024	t	tobechecked	\N
115035	t	tobechecked	\N
115037	t	tobechecked	\N
115038	t	tobechecked	\N
115039	t	tobechecked	\N
115040	t	tobechecked	\N
115041	t	tobechecked	\N
115042	t	tobechecked	\N
115043	t	tobechecked	\N
115045	t	tobechecked	\N
115050	t	tobechecked	\N
115051	t	tobechecked	\N
115055	t	tobechecked	\N
115062	t	tobechecked	\N
115082	t	tobechecked	\N
115085	f	tobechecked	\N
115087	f	tobechecked	2025-03-15 00:00:00
115088	f	tobechecked	2026-05-28 00:00:00
115089	f	tobechecked	2027-07-15 00:00:00
115090	f	tobechecked	2028-03-28 00:00:00
115091	f	tobechecked	2031-03-31 00:00:00
115092	f	tobechecked	2031-02-17 00:00:00
115094	f	tobechecked	2025-12-18 00:00:00
115097	f	tobechecked	2025-10-26 00:00:00
115098	f	tobechecked	2025-06-08 00:00:00
115099	f	tobechecked	2027-09-04 00:00:00
115100	t	tobechecked	\N
115114	f	tobechecked	\N
115146	f	tobechecked	\N
115150	t	tobechecked	\N
115154	f	tobechecked	\N
115187	f	tobechecked	\N
115192	f	tobechecked	\N
115193	f	tobechecked	\N
115228	t	tobechecked	\N
115246	t	tobechecked	\N
115247	t	tobechecked	\N
115248	t	tobechecked	\N
115254	t	tobechecked	\N
115256	t	tobechecked	\N
115266	t	tobechecked	\N
115267	t	tobechecked	\N
115268	t	tobechecked	\N
115269	t	tobechecked	\N
115270	t	tobechecked	\N
115271	t	tobechecked	\N
115273	t	tobechecked	\N
115275	t	tobechecked	\N
115276	t	tobechecked	\N
115277	t	tobechecked	\N
115278	t	tobechecked	\N
115280	t	tobechecked	\N
115281	t	tobechecked	\N
115282	t	tobechecked	\N
115283	t	tobechecked	\N
115284	t	tobechecked	\N
115285	t	tobechecked	\N
115286	t	tobechecked	\N
115287	t	tobechecked	\N
115288	t	tobechecked	\N
115289	t	tobechecked	\N
115290	t	tobechecked	\N
115291	t	tobechecked	\N
115293	t	tobechecked	\N
115294	t	tobechecked	\N
115295	t	tobechecked	\N
115296	t	tobechecked	\N
115297	t	tobechecked	\N
115298	t	tobechecked	\N
115300	t	tobechecked	\N
115301	t	tobechecked	\N
115302	t	tobechecked	\N
115331	t	tobechecked	\N
115341	f	tobechecked	\N
115342	f	tobechecked	\N
115343	f	tobechecked	\N
115346	f	tobechecked	\N
115351	f	tobechecked	\N
115357	f	tobechecked	\N
115386	t	tobechecked	\N
115411	f	tobechecked	\N
115440	f	tobechecked	2032-07-01 00:00:00
115441	f	tobechecked	2028-08-06 00:00:00
115442	f	tobechecked	2028-10-29 00:00:00
115443	f	tobechecked	2028-11-12 00:00:00
115444	f	tobechecked	2029-01-07 00:00:00
115445	f	tobechecked	2029-01-07 00:00:00
115446	f	tobechecked	2029-01-07 00:00:00
115447	f	tobechecked	2029-01-12 00:00:00
115448	f	tobechecked	2029-03-19 00:00:00
115449	f	tobechecked	2029-03-19 00:00:00
115450	f	tobechecked	2029-12-15 00:00:00
115451	f	tobechecked	2025-11-14 00:00:00
115452	f	tobechecked	2026-10-26 00:00:00
115453	f	tobechecked	2026-04-20 00:00:00
115454	f	tobechecked	2026-08-21 00:00:00
115455	f	tobechecked	2026-10-16 00:00:00
115456	f	tobechecked	2029-10-28 00:00:00
115457	f	tobechecked	2029-04-13 00:00:00
115458	f	tobechecked	2026-05-21 00:00:00
115460	f	tobechecked	2027-02-22 00:00:00
115461	f	tobechecked	2028-03-04 00:00:00
115462	f	tobechecked	2028-11-18 00:00:00
115473	f	tobechecked	2026-10-01 00:00:00
115503	f	tobechecked	\N
115537	f	tobechecked	\N
115539	f	tobechecked	\N
115540	f	tobechecked	\N
115541	f	tobechecked	\N
115542	f	tobechecked	\N
115543	f	tobechecked	\N
115544	f	tobechecked	\N
115546	f	tobechecked	\N
115549	f	tobechecked	\N
115550	f	tobechecked	\N
115551	f	tobechecked	\N
115552	f	tobechecked	\N
115556	f	tobechecked	\N
115557	f	tobechecked	\N
115559	f	tobechecked	\N
115560	f	tobechecked	\N
115562	f	tobechecked	\N
115563	f	tobechecked	\N
115574	t	tobechecked	\N
115575	t	tobechecked	\N
115576	t	tobechecked	\N
115577	t	tobechecked	\N
115578	t	tobechecked	\N
115579	t	tobechecked	\N
115580	t	tobechecked	\N
115581	t	tobechecked	\N
115582	t	tobechecked	\N
115583	t	tobechecked	\N
115584	t	tobechecked	\N
115594	f	tobechecked	\N
115604	t	tobechecked	\N
115605	t	tobechecked	\N
115606	t	tobechecked	\N
115607	t	tobechecked	\N
115608	t	tobechecked	\N
115609	t	tobechecked	\N
115610	t	tobechecked	\N
115611	t	tobechecked	\N
115640	t	tobechecked	\N
115645	t	tobechecked	\N
115647	t	tobechecked	\N
115649	t	tobechecked	\N
115654	t	tobechecked	\N
115657	t	tobechecked	\N
115658	t	tobechecked	\N
115659	t	tobechecked	\N
115660	t	tobechecked	\N
115661	f	tobechecked	\N
115662	t	tobechecked	\N
115663	t	tobechecked	\N
115664	t	tobechecked	\N
115665	t	tobechecked	\N
115666	t	tobechecked	\N
115667	t	tobechecked	\N
115670	f	tobechecked	\N
115765	f	tobechecked	\N
115766	f	tobechecked	\N
115772	f	tobechecked	\N
115773	f	tobechecked	\N
115782	t	tobechecked	\N
115783	t	tobechecked	\N
115800	t	tobechecked	\N
115840	t	tobechecked	\N
115841	t	tobechecked	\N
115842	t	tobechecked	\N
115843	t	tobechecked	\N
115845	f	tobechecked	\N
115846	f	tobechecked	\N
115857	f	tobechecked	\N
115858	f	tobechecked	\N
115859	f	tobechecked	\N
115860	f	tobechecked	\N
115861	f	tobechecked	\N
115862	f	tobechecked	\N
115887	f	tobechecked	\N
115889	f	tobechecked	\N
115892	f	tobechecked	\N
115893	f	tobechecked	\N
115894	f	tobechecked	2059-12-31 00:00:00
115897	f	tobechecked	\N
115901	f	tobechecked	\N
115903	f	tobechecked	\N
115905	f	tobechecked	\N
115909	f	tobechecked	\N
115910	f	tobechecked	\N
115911	f	tobechecked	\N
115912	f	tobechecked	\N
115913	f	tobechecked	\N
115914	f	tobechecked	\N
115915	f	tobechecked	\N
115917	f	tobechecked	\N
115920	f	tobechecked	\N
115921	f	tobechecked	\N
115922	f	tobechecked	\N
115923	f	tobechecked	\N
115924	f	tobechecked	\N
115926	f	tobechecked	\N
115927	f	tobechecked	\N
115928	f	tobechecked	\N
115929	f	tobechecked	2034-12-31 00:00:00
115930	f	tobechecked	\N
115946	t	tobechecked	\N
115959	t	tobechecked	\N
115961	f	tobechecked	\N
115964	t	tobechecked	\N
115967	t	tobechecked	\N
115968	t	tobechecked	\N
115969	t	tobechecked	\N
115970	t	tobechecked	\N
115971	t	tobechecked	\N
115972	t	tobechecked	\N
115973	t	tobechecked	\N
115980	t	tobechecked	\N
115981	t	tobechecked	\N
115982	t	tobechecked	\N
115989	t	tobechecked	\N
115990	t	tobechecked	\N
115991	t	tobechecked	\N
115992	t	tobechecked	\N
115993	t	tobechecked	\N
115994	t	tobechecked	\N
115995	t	tobechecked	\N
116000	t	tobechecked	\N
116003	t	tobechecked	\N
116049	f	tobechecked	2027-03-11 00:00:00
116050	f	tobechecked	2027-05-13 00:00:00
116051	f	tobechecked	2027-08-29 00:00:00
116052	f	tobechecked	2027-06-18 00:00:00
116053	f	tobechecked	2027-06-24 00:00:00
116054	f	tobechecked	2030-02-28 00:00:00
116055	f	tobechecked	2027-07-19 00:00:00
116056	f	tobechecked	2028-11-21 00:00:00
116057	f	tobechecked	2028-02-17 00:00:00
116058	f	tobechecked	2028-03-04 00:00:00
116059	f	tobechecked	2028-08-18 00:00:00
116060	f	tobechecked	2031-04-24 00:00:00
116061	f	tobechecked	2027-10-25 00:00:00
116062	f	tobechecked	2028-03-13 00:00:00
116070	t	tobechecked	\N
116071	t	tobechecked	\N
116072	t	tobechecked	\N
116073	t	tobechecked	\N
116074	f	tobechecked	2026-11-28 00:00:00
116075	f	tobechecked	2029-07-15 00:00:00
116122	f	tobechecked	\N
116123	f	tobechecked	\N
116150	f	tobechecked	\N
116152	f	tobechecked	\N
116153	f	tobechecked	\N
116157	f	tobechecked	\N
116240	t	tobechecked	\N
116241	f	tobechecked	\N
116249	t	tobechecked	\N
116252	t	tobechecked	\N
116260	t	tobechecked	\N
116285	t	tobechecked	\N
116286	t	tobechecked	\N
116290	t	tobechecked	\N
116323	t	tobechecked	\N
116324	t	tobechecked	\N
116325	t	tobechecked	\N
116326	t	tobechecked	\N
116327	t	tobechecked	\N
116328	t	tobechecked	\N
116329	t	tobechecked	\N
116330	t	tobechecked	\N
116331	t	tobechecked	\N
116332	t	tobechecked	\N
116333	t	tobechecked	\N
116334	t	tobechecked	\N
116335	t	tobechecked	\N
116336	t	tobechecked	\N
116337	t	tobechecked	\N
116338	t	tobechecked	\N
116339	t	tobechecked	\N
116340	t	tobechecked	\N
116341	t	tobechecked	\N
116342	t	tobechecked	\N
116343	t	tobechecked	\N
116344	t	tobechecked	\N
116345	t	tobechecked	\N
116346	t	tobechecked	\N
116352	f	tobechecked	\N
116360	f	tobechecked	\N
116364	f	tobechecked	\N
116365	f	tobechecked	\N
116370	f	tobechecked	\N
116377	f	tobechecked	\N
116382	f	tobechecked	\N
116389	f	tobechecked	\N
116402	f	tobechecked	\N
116473	f	tobechecked	2029-01-12 00:00:00
116474	f	tobechecked	2028-12-18 00:00:00
116475	f	tobechecked	2029-04-05 00:00:00
116476	f	tobechecked	2029-12-24 00:00:00
116477	f	tobechecked	2030-02-11 00:00:00
116478	f	tobechecked	2030-02-08 00:00:00
116479	f	tobechecked	2029-12-15 00:00:00
116480	f	tobechecked	2030-04-28 00:00:00
116481	f	tobechecked	2030-05-12 00:00:00
116482	f	tobechecked	2030-05-27 00:00:00
116483	f	tobechecked	2030-08-22 00:00:00
116486	t	tobechecked	\N
116487	t	tobechecked	\N
116563	f	tobechecked	\N
116564	f	tobechecked	\N
116566	f	tobechecked	\N
116569	f	tobechecked	\N
116585	f	tobechecked	\N
116612	f	tobechecked	\N
116613	f	tobechecked	\N
116615	f	tobechecked	\N
116616	f	tobechecked	\N
116617	f	tobechecked	\N
116618	f	tobechecked	\N
116621	f	tobechecked	\N
116622	f	tobechecked	\N
116623	f	tobechecked	\N
116624	f	tobechecked	\N
116625	f	tobechecked	\N
116626	f	tobechecked	\N
116628	f	tobechecked	2024-12-31 00:00:00
116629	f	tobechecked	\N
116630	f	tobechecked	\N
116631	f	tobechecked	\N
116632	f	tobechecked	\N
116633	f	tobechecked	\N
116634	f	tobechecked	\N
116637	f	tobechecked	\N
116639	f	tobechecked	\N
116641	f	tobechecked	\N
116642	f	tobechecked	\N
116643	f	tobechecked	\N
116644	f	tobechecked	\N
116645	f	tobechecked	\N
116647	f	tobechecked	\N
116648	f	tobechecked	\N
116650	f	tobechecked	\N
116651	f	tobechecked	\N
116652	f	tobechecked	\N
116653	f	tobechecked	\N
116654	f	tobechecked	\N
116655	f	tobechecked	\N
116656	f	tobechecked	\N
116657	f	tobechecked	\N
116658	f	tobechecked	\N
116659	f	tobechecked	\N
116660	f	tobechecked	\N
116661	f	tobechecked	\N
116664	f	tobechecked	\N
116665	f	tobechecked	\N
116666	f	tobechecked	\N
116667	f	tobechecked	\N
116668	f	tobechecked	\N
116669	f	tobechecked	\N
116670	f	tobechecked	\N
116671	f	tobechecked	\N
116672	f	tobechecked	\N
116673	f	tobechecked	\N
116674	f	tobechecked	\N
116675	t	tobechecked	\N
116676	f	tobechecked	\N
116677	f	tobechecked	\N
116678	f	tobechecked	\N
116679	f	tobechecked	\N
116680	f	tobechecked	\N
116681	f	tobechecked	\N
116682	f	tobechecked	\N
116683	f	tobechecked	\N
116684	f	tobechecked	\N
116685	t	tobechecked	\N
116686	f	tobechecked	\N
116687	f	tobechecked	\N
116688	t	tobechecked	\N
116689	t	tobechecked	\N
116690	f	tobechecked	\N
116691	f	tobechecked	\N
116692	f	tobechecked	\N
116693	f	tobechecked	\N
116694	f	tobechecked	\N
116695	f	tobechecked	\N
116696	f	tobechecked	\N
116697	t	tobechecked	\N
116698	f	tobechecked	\N
116699	t	tobechecked	\N
116700	t	tobechecked	\N
116701	f	tobechecked	\N
116702	t	tobechecked	\N
116703	t	tobechecked	\N
116704	t	tobechecked	\N
116705	t	tobechecked	\N
116706	t	tobechecked	\N
116707	t	tobechecked	\N
116708	t	tobechecked	\N
116709	t	tobechecked	\N
116710	t	tobechecked	\N
116711	f	tobechecked	\N
116712	f	tobechecked	\N
116713	f	tobechecked	\N
116714	t	tobechecked	\N
116715	f	tobechecked	\N
116716	t	tobechecked	\N
116717	t	tobechecked	\N
116718	t	tobechecked	\N
116719	f	tobechecked	\N
116720	f	tobechecked	\N
116721	f	tobechecked	\N
116722	f	tobechecked	\N
116723	f	tobechecked	\N
116724	f	tobechecked	\N
116725	f	tobechecked	\N
116726	f	tobechecked	\N
116727	t	tobechecked	\N
116728	f	tobechecked	\N
116729	f	tobechecked	\N
116730	t	tobechecked	\N
116731	t	tobechecked	\N
116732	t	tobechecked	\N
116733	t	tobechecked	\N
116734	t	tobechecked	\N
116735	t	tobechecked	\N
116736	t	tobechecked	\N
116737	f	tobechecked	\N
116738	f	tobechecked	\N
116739	t	tobechecked	\N
116740	t	tobechecked	\N
116741	t	tobechecked	\N
116742	f	tobechecked	\N
116743	t	tobechecked	\N
116744	t	tobechecked	\N
116745	t	tobechecked	\N
116746	t	tobechecked	\N
116747	t	tobechecked	\N
116748	t	tobechecked	\N
116749	f	tobechecked	\N
116750	f	tobechecked	\N
116751	f	tobechecked	\N
116752	f	tobechecked	\N
116753	f	tobechecked	\N
116754	f	tobechecked	\N
116755	f	tobechecked	\N
116756	f	tobechecked	\N
116757	f	tobechecked	\N
116758	t	tobechecked	\N
116759	t	tobechecked	\N
116760	f	tobechecked	\N
116761	f	tobechecked	\N
116762	f	tobechecked	\N
116763	f	tobechecked	\N
116764	f	tobechecked	\N
116765	f	tobechecked	\N
116766	f	tobechecked	\N
116767	f	tobechecked	\N
116768	f	tobechecked	\N
116769	f	tobechecked	\N
116770	f	tobechecked	\N
116771	f	tobechecked	\N
116772	f	tobechecked	\N
116773	f	tobechecked	\N
116774	f	tobechecked	\N
116775	f	tobechecked	\N
116776	f	tobechecked	\N
116777	f	tobechecked	\N
116778	f	tobechecked	\N
116779	f	tobechecked	\N
116780	f	tobechecked	\N
116781	f	tobechecked	\N
116782	f	tobechecked	\N
116783	f	tobechecked	\N
116784	f	tobechecked	\N
116785	f	tobechecked	\N
116786	f	tobechecked	\N
116787	f	tobechecked	\N
116788	f	tobechecked	\N
116789	f	tobechecked	\N
116790	f	tobechecked	\N
116791	f	tobechecked	\N
116792	f	tobechecked	\N
116793	f	tobechecked	\N
116794	f	tobechecked	\N
116795	f	tobechecked	\N
116796	f	tobechecked	\N
116797	f	tobechecked	\N
116798	f	tobechecked	\N
116799	f	tobechecked	\N
116800	f	tobechecked	\N
116801	f	tobechecked	\N
116802	f	tobechecked	\N
116803	f	tobechecked	\N
116804	f	tobechecked	\N
116805	f	tobechecked	\N
116806	f	tobechecked	\N
116807	f	tobechecked	\N
116808	f	tobechecked	\N
116809	f	tobechecked	\N
116810	f	tobechecked	\N
116811	f	tobechecked	\N
116812	f	tobechecked	\N
116813	f	tobechecked	\N
116814	f	tobechecked	\N
116815	f	tobechecked	\N
116816	f	tobechecked	\N
116817	f	tobechecked	\N
116818	f	tobechecked	\N
116819	f	tobechecked	\N
116820	f	tobechecked	\N
116821	f	tobechecked	\N
116822	f	tobechecked	\N
116823	f	tobechecked	\N
116824	f	tobechecked	\N
116825	f	tobechecked	\N
116826	f	tobechecked	\N
116827	f	tobechecked	\N
116828	f	tobechecked	\N
116829	f	tobechecked	\N
116830	f	tobechecked	\N
116831	f	tobechecked	\N
116832	f	tobechecked	\N
116833	f	tobechecked	\N
116834	t	tobechecked	\N
116835	t	tobechecked	\N
116836	t	tobechecked	\N
116837	t	tobechecked	\N
116838	t	tobechecked	\N
116839	t	tobechecked	\N
116840	t	tobechecked	\N
116841	t	tobechecked	\N
116842	t	tobechecked	\N
116843	t	tobechecked	\N
116844	t	tobechecked	\N
116845	t	tobechecked	\N
116846	t	tobechecked	\N
116847	f	tobechecked	\N
116848	f	tobechecked	\N
116849	f	tobechecked	\N
116850	f	tobechecked	\N
116851	f	tobechecked	\N
116852	f	tobechecked	\N
116853	f	tobechecked	\N
116854	f	tobechecked	\N
116855	f	tobechecked	\N
116856	f	tobechecked	\N
116857	f	tobechecked	\N
116858	f	tobechecked	\N
116859	f	tobechecked	\N
116860	f	tobechecked	\N
116861	f	tobechecked	\N
116862	f	tobechecked	\N
116863	f	tobechecked	\N
116864	f	tobechecked	\N
116865	f	tobechecked	\N
116866	f	tobechecked	\N
116869	t	tobechecked	\N
116870	t	tobechecked	\N
116871	t	tobechecked	\N
116872	t	tobechecked	\N
116918	f	tobechecked	\N
116921	f	tobechecked	\N
116924	t	tobechecked	\N
116934	t	tobechecked	\N
116935	t	tobechecked	\N
116969	f	tobechecked	\N
116970	f	tobechecked	\N
116971	f	tobechecked	\N
116992	f	tobechecked	\N
116993	f	tobechecked	\N
116994	f	tobechecked	\N
116995	f	tobechecked	\N
117018	t	tobechecked	\N
117019	t	tobechecked	\N
117029	t	tobechecked	\N
117031	t	tobechecked	\N
117041	t	tobechecked	\N
117049	t	tobechecked	\N
117050	t	tobechecked	\N
117052	t	tobechecked	\N
117053	f	tobechecked	\N
117054	t	tobechecked	\N
117055	t	tobechecked	\N
117078	t	tobechecked	\N
117138	f	tobechecked	\N
117147	f	tobechecked	\N
117149	f	tobechecked	\N
117150	f	tobechecked	\N
117168	f	tobechecked	\N
117169	f	tobechecked	\N
117177	f	tobechecked	\N
117180	f	tobechecked	\N
117181	f	tobechecked	\N
117182	t	tobechecked	\N
117183	t	tobechecked	\N
117184	t	tobechecked	\N
117198	t	tobechecked	\N
117204	t	tobechecked	\N
117206	t	tobechecked	\N
117217	t	tobechecked	\N
117218	t	tobechecked	\N
117220	t	tobechecked	\N
117223	t	tobechecked	\N
117225	t	tobechecked	\N
117229	t	tobechecked	\N
117230	t	tobechecked	\N
117234	t	tobechecked	\N
117237	t	tobechecked	\N
117243	t	tobechecked	\N
117255	t	tobechecked	\N
117262	f	tobechecked	\N
117309	f	tobechecked	\N
117313	f	tobechecked	2099-12-31 00:00:00
117317	f	tobechecked	\N
117319	f	tobechecked	\N
117322	f	tobechecked	\N
117331	t	tobechecked	\N
117332	t	tobechecked	\N
117333	f	tobechecked	2030-09-08 00:00:00
117334	f	tobechecked	2031-07-05 00:00:00
117335	f	tobechecked	2032-10-03 00:00:00
117336	f	tobechecked	2030-09-20 00:00:00
117337	f	tobechecked	2032-04-29 00:00:00
117338	f	tobechecked	2030-12-19 00:00:00
117339	f	tobechecked	2031-05-03 00:00:00
117340	f	tobechecked	2032-05-25 00:00:00
117341	f	tobechecked	2031-09-27 00:00:00
117342	f	tobechecked	2031-06-07 00:00:00
117343	f	tobechecked	2030-12-22 00:00:00
117344	f	tobechecked	2031-03-10 00:00:00
117345	f	tobechecked	2031-06-20 00:00:00
117346	f	tobechecked	2033-02-28 00:00:00
117388	t	tobechecked	\N
117390	f	tobechecked	\N
117431	f	tobechecked	\N
117459	t	tobechecked	\N
117470	t	tobechecked	\N
117499	t	tobechecked	\N
117542	t	tobechecked	\N
117543	t	tobechecked	\N
117544	t	tobechecked	\N
117545	t	tobechecked	\N
117546	t	tobechecked	\N
117547	t	tobechecked	\N
117548	t	tobechecked	\N
117549	t	tobechecked	\N
117551	t	tobechecked	\N
117554	t	tobechecked	\N
117555	t	tobechecked	\N
117557	t	tobechecked	\N
117558	t	tobechecked	\N
117559	t	tobechecked	\N
117560	t	tobechecked	\N
117561	t	tobechecked	\N
117562	t	tobechecked	\N
117563	t	tobechecked	\N
117564	t	tobechecked	\N
117565	t	tobechecked	\N
117566	t	tobechecked	\N
117637	f	tobechecked	\N
117638	f	tobechecked	\N
117639	f	tobechecked	\N
117687	t	tobechecked	\N
117699	t	tobechecked	\N
117700	t	tobechecked	\N
117701	t	tobechecked	\N
117702	t	tobechecked	\N
117703	f	tobechecked	\N
117712	f	tobechecked	2034-02-01 00:00:00
117721	t	tobechecked	\N
117724	t	tobechecked	\N
117729	t	tobechecked	\N
117730	t	tobechecked	\N
117742	f	tobechecked	\N
117746	t	tobechecked	\N
117752	t	tobechecked	\N
117754	t	tobechecked	\N
117755	t	tobechecked	\N
117756	t	tobechecked	\N
117757	t	tobechecked	\N
117758	t	tobechecked	\N
117773	t	tobechecked	\N
117774	t	tobechecked	\N
117775	t	tobechecked	\N
117776	t	tobechecked	\N
117778	t	tobechecked	\N
117779	t	tobechecked	\N
117780	t	tobechecked	\N
117781	t	tobechecked	\N
117782	t	tobechecked	\N
117783	t	tobechecked	\N
117784	t	tobechecked	\N
117785	t	tobechecked	\N
117786	t	tobechecked	\N
117787	t	tobechecked	\N
117788	t	tobechecked	\N
117789	t	tobechecked	\N
117793	t	tobechecked	\N
117794	t	tobechecked	\N
117797	t	tobechecked	\N
117798	t	tobechecked	\N
117799	t	tobechecked	\N
117800	t	tobechecked	\N
117801	t	tobechecked	\N
117802	t	tobechecked	\N
117803	t	tobechecked	\N
117804	t	tobechecked	\N
117805	t	tobechecked	\N
117806	t	tobechecked	\N
117807	t	tobechecked	\N
117808	t	tobechecked	\N
117809	t	tobechecked	\N
117810	t	tobechecked	\N
117811	t	tobechecked	\N
117812	t	tobechecked	\N
117813	t	tobechecked	\N
117814	t	tobechecked	\N
117815	t	tobechecked	\N
117816	t	tobechecked	\N
117817	t	tobechecked	\N
117818	t	tobechecked	\N
117819	t	tobechecked	\N
117820	t	tobechecked	\N
117821	t	tobechecked	\N
117822	t	tobechecked	\N
117823	t	tobechecked	\N
117824	t	tobechecked	\N
117825	t	tobechecked	\N
117826	t	tobechecked	\N
117827	t	tobechecked	\N
117828	t	tobechecked	\N
117829	t	tobechecked	\N
117830	t	tobechecked	\N
117831	t	tobechecked	\N
117832	t	tobechecked	\N
117833	t	tobechecked	\N
117834	t	tobechecked	\N
117835	t	tobechecked	\N
117836	t	tobechecked	\N
117837	t	tobechecked	\N
117838	t	tobechecked	\N
117839	t	tobechecked	\N
117840	t	tobechecked	\N
117841	t	tobechecked	\N
117842	t	tobechecked	\N
117843	t	tobechecked	\N
117844	t	tobechecked	\N
117845	t	tobechecked	\N
117846	t	tobechecked	\N
117847	t	tobechecked	\N
117848	t	tobechecked	\N
117849	t	tobechecked	\N
117850	t	tobechecked	\N
117851	t	tobechecked	\N
117853	t	tobechecked	\N
117854	t	tobechecked	\N
117855	t	tobechecked	\N
117856	t	tobechecked	\N
117857	t	tobechecked	\N
117858	t	tobechecked	\N
117859	t	tobechecked	\N
117860	t	tobechecked	\N
117861	t	tobechecked	\N
117862	t	tobechecked	\N
117863	t	tobechecked	\N
117864	t	tobechecked	\N
117865	t	tobechecked	\N
117866	t	tobechecked	\N
117867	t	tobechecked	\N
117868	t	tobechecked	\N
117869	t	tobechecked	\N
117870	t	tobechecked	\N
117871	t	tobechecked	\N
117872	t	tobechecked	\N
117873	t	tobechecked	\N
117874	t	tobechecked	\N
117875	t	tobechecked	\N
117876	t	tobechecked	\N
117877	t	tobechecked	\N
117878	t	tobechecked	\N
117879	t	tobechecked	\N
117880	t	tobechecked	\N
117881	t	tobechecked	\N
117882	t	tobechecked	\N
117883	t	tobechecked	\N
117884	t	tobechecked	\N
117885	t	tobechecked	\N
117886	t	tobechecked	\N
117887	t	tobechecked	\N
117888	t	tobechecked	\N
117889	t	tobechecked	\N
117891	t	tobechecked	\N
117892	t	tobechecked	\N
117893	t	tobechecked	\N
117894	t	tobechecked	\N
117895	t	tobechecked	\N
117896	t	tobechecked	\N
117897	t	tobechecked	\N
117907	t	tobechecked	\N
117910	t	tobechecked	\N
117916	t	tobechecked	\N
117917	t	tobechecked	\N
117918	t	tobechecked	\N
117944	t	tobechecked	\N
117970	t	tobechecked	\N
117972	t	tobechecked	\N
117975	t	tobechecked	\N
117977	t	tobechecked	\N
118033	t	tobechecked	\N
118056	t	tobechecked	\N
118066	t	tobechecked	\N
118088	t	tobechecked	\N
118089	t	tobechecked	\N
118099	t	tobechecked	\N
118148	f	tobechecked	\N
118149	f	tobechecked	\N
118159	f	tobechecked	\N
118161	f	tobechecked	\N
118162	f	tobechecked	\N
118163	f	tobechecked	\N
118168	f	tobechecked	\N
118170	f	tobechecked	\N
118171	f	tobechecked	\N
118173	f	tobechecked	\N
118175	f	tobechecked	\N
118176	f	tobechecked	\N
118177	f	tobechecked	\N
118178	f	tobechecked	\N
118179	f	tobechecked	\N
118180	f	tobechecked	\N
118181	f	tobechecked	\N
118182	f	tobechecked	\N
118183	f	tobechecked	\N
118184	f	tobechecked	\N
118185	f	tobechecked	\N
118187	f	tobechecked	\N
118188	f	tobechecked	\N
118190	f	tobechecked	\N
118191	f	tobechecked	\N
118193	f	tobechecked	\N
118194	f	tobechecked	\N
118195	f	tobechecked	\N
118196	f	tobechecked	\N
118197	f	tobechecked	\N
118199	f	tobechecked	\N
118200	f	tobechecked	\N
118201	f	tobechecked	\N
118202	f	tobechecked	\N
118203	f	tobechecked	\N
118204	f	tobechecked	\N
118205	f	tobechecked	\N
118206	f	tobechecked	\N
118207	f	tobechecked	\N
118208	f	tobechecked	\N
118209	f	tobechecked	\N
118210	f	tobechecked	\N
118211	f	tobechecked	\N
118212	f	tobechecked	\N
118213	f	tobechecked	\N
118214	f	tobechecked	\N
118215	f	tobechecked	\N
118216	f	tobechecked	\N
118217	f	tobechecked	\N
118231	t	tobechecked	\N
118234	t	tobechecked	\N
118235	t	tobechecked	\N
118238	t	tobechecked	\N
118240	t	tobechecked	\N
118251	t	tobechecked	\N
118252	t	tobechecked	\N
118253	t	tobechecked	\N
118255	t	tobechecked	\N
118256	t	tobechecked	\N
118257	t	tobechecked	\N
118258	t	tobechecked	\N
118260	t	tobechecked	\N
118262	f	tobechecked	\N
118265	t	tobechecked	\N
118266	f	tobechecked	\N
118271	t	tobechecked	\N
118272	t	tobechecked	\N
118273	t	tobechecked	\N
118276	t	tobechecked	\N
118277	t	tobechecked	\N
118297	t	tobechecked	\N
118302	t	tobechecked	\N
118309	t	tobechecked	\N
118321	f	tobechecked	\N
118323	f	tobechecked	\N
118327	f	tobechecked	\N
118336	f	tobechecked	2031-06-29 00:00:00
118337	f	tobechecked	2031-08-28 00:00:00
118338	f	tobechecked	2032-09-28 00:00:00
118339	f	tobechecked	2033-04-30 00:00:00
118340	f	tobechecked	2026-03-07 00:00:00
118341	f	tobechecked	2027-08-02 00:00:00
118342	f	tobechecked	2031-12-19 00:00:00
118343	f	tobechecked	2026-01-06 00:00:00
118344	f	tobechecked	2037-01-26 00:00:00
118345	f	tobechecked	2032-07-11 00:00:00
118346	f	tobechecked	2026-09-04 00:00:00
118377	f	tobechecked	2032-06-27 00:00:00
118508	t	tobechecked	\N
118534	t	tobechecked	\N
118539	f	tobechecked	\N
118573	t	tobechecked	\N
118574	t	tobechecked	\N
118576	t	tobechecked	\N
118577	t	tobechecked	\N
118578	t	tobechecked	\N
118588	t	tobechecked	\N
118593	t	tobechecked	\N
118680	t	tobechecked	\N
118693	t	tobechecked	\N
118695	t	tobechecked	\N
118812	t	tobechecked	\N
118813	t	tobechecked	\N
118814	t	tobechecked	\N
118817	t	tobechecked	\N
118818	t	tobechecked	\N
118820	t	tobechecked	\N
118821	t	tobechecked	\N
118822	t	tobechecked	\N
118823	t	tobechecked	\N
118824	t	tobechecked	\N
118826	t	tobechecked	\N
118827	t	tobechecked	\N
118829	t	tobechecked	\N
118830	t	tobechecked	\N
118832	t	tobechecked	\N
118833	t	tobechecked	\N
118835	t	tobechecked	\N
118836	t	tobechecked	\N
118837	t	tobechecked	\N
118843	t	tobechecked	\N
118844	t	tobechecked	\N
118845	t	tobechecked	\N
118847	t	tobechecked	\N
118944	t	tobechecked	\N
118989	t	tobechecked	\N
118990	t	tobechecked	\N
119073	t	tobechecked	\N
119077	t	tobechecked	\N
119078	t	tobechecked	\N
119089	t	tobechecked	\N
119108	t	tobechecked	\N
119109	t	tobechecked	\N
119137	t	tobechecked	\N
119301	t	tobechecked	\N
119302	t	tobechecked	\N
119305	t	tobechecked	\N
119322	t	tobechecked	\N
119330	t	tobechecked	\N
119332	t	tobechecked	\N
119335	t	tobechecked	\N
119336	t	tobechecked	\N
119337	t	tobechecked	\N
119342	t	tobechecked	\N
119343	t	tobechecked	\N
119344	t	tobechecked	\N
119351	t	tobechecked	\N
119367	t	tobechecked	\N
119371	t	tobechecked	\N
119372	t	tobechecked	\N
119373	t	tobechecked	\N
119374	t	tobechecked	\N
119375	t	tobechecked	\N
119377	t	tobechecked	\N
119385	t	tobechecked	\N
119387	t	tobechecked	\N
119388	t	tobechecked	\N
119389	t	tobechecked	\N
119390	t	tobechecked	\N
119391	t	tobechecked	\N
119392	t	tobechecked	\N
119393	t	tobechecked	\N
119394	t	tobechecked	\N
119395	t	tobechecked	\N
119396	t	tobechecked	\N
119397	t	tobechecked	\N
119398	t	tobechecked	\N
119399	t	tobechecked	\N
119400	t	tobechecked	\N
119401	t	tobechecked	\N
119402	t	tobechecked	\N
119405	f	tobechecked	\N
119406	f	tobechecked	\N
119407	f	tobechecked	\N
119408	f	tobechecked	\N
119409	f	tobechecked	\N
119444	t	tobechecked	\N
119446	t	tobechecked	\N
119447	t	tobechecked	\N
119473	t	tobechecked	\N
119474	t	tobechecked	\N
119517	t	tobechecked	\N
119579	t	tobechecked	\N
119580	t	tobechecked	\N
119581	t	tobechecked	\N
119585	t	tobechecked	\N
119586	f	tobechecked	2034-11-16 00:00:00
119587	f	tobechecked	2035-01-30 00:00:00
119588	f	tobechecked	2035-01-13 00:00:00
119589	f	tobechecked	2034-09-10 00:00:00
119590	f	tobechecked	2036-07-21 00:00:00
119591	f	tobechecked	2036-12-16 00:00:00
119592	f	tobechecked	2036-12-27 00:00:00
119593	f	tobechecked	2034-07-07 00:00:00
119594	t	tobechecked	\N
119598	f	tobechecked	2034-01-01 00:00:00
119652	t	tobechecked	\N
119653	t	tobechecked	\N
119779	t	tobechecked	\N
119782	t	tobechecked	\N
119783	t	tobechecked	\N
119793	f	tobechecked	\N
119795	t	tobechecked	\N
119799	t	tobechecked	\N
119802	t	tobechecked	\N
119804	t	tobechecked	\N
119807	t	tobechecked	\N
119809	f	tobechecked	\N
119812	f	tobechecked	\N
119814	f	tobechecked	\N
119819	t	tobechecked	\N
119824	f	tobechecked	\N
119834	f	tobechecked	\N
119838	f	tobechecked	\N
119839	f	tobechecked	\N
119840	f	tobechecked	\N
119841	f	tobechecked	\N
119842	f	tobechecked	\N
119843	f	tobechecked	\N
119864	f	tobechecked	\N
119923	t	tobechecked	\N
119960	t	tobechecked	\N
119972	t	tobechecked	\N
119990	t	tobechecked	\N
119991	t	tobechecked	\N
120005	t	tobechecked	\N
120006	t	tobechecked	\N
120078	t	tobechecked	\N
120087	t	tobechecked	\N
120096	t	tobechecked	\N
120102	t	tobechecked	\N
120104	t	tobechecked	\N
120112	t	tobechecked	\N
120124	t	tobechecked	\N
120179	t	tobechecked	\N
120189	t	tobechecked	\N
120190	t	tobechecked	\N
120191	t	tobechecked	\N
120210	t	tobechecked	\N
120218	t	tobechecked	\N
120235	t	tobechecked	\N
120315	t	tobechecked	\N
120321	t	tobechecked	\N
120322	t	tobechecked	\N
120327	t	tobechecked	\N
120328	t	tobechecked	\N
120329	t	tobechecked	\N
120330	t	tobechecked	\N
120331	t	tobechecked	\N
120332	t	tobechecked	\N
120334	t	tobechecked	\N
120335	t	tobechecked	\N
120349	t	tobechecked	\N
120350	t	tobechecked	\N
120351	t	tobechecked	\N
120353	t	tobechecked	\N
120354	t	tobechecked	\N
120355	t	tobechecked	\N
120359	t	tobechecked	\N
120360	t	tobechecked	\N
120361	t	tobechecked	\N
120370	t	tobechecked	\N
120411	t	tobechecked	\N
120471	f	tobechecked	\N
120626	t	tobechecked	\N
120627	t	tobechecked	\N
120628	t	tobechecked	\N
120629	t	tobechecked	\N
120634	t	tobechecked	\N
120670	f	tobechecked	\N
120671	f	tobechecked	\N
120672	f	tobechecked	\N
120673	f	tobechecked	\N
120674	f	tobechecked	\N
120691	t	tobechecked	\N
120692	t	tobechecked	\N
120705	f	tobechecked	\N
120725	f	tobechecked	\N
120730	f	tobechecked	\N
120787	f	tobechecked	2036-01-05 00:00:00
120788	f	tobechecked	2036-01-05 00:00:00
120789	f	tobechecked	2036-01-05 00:00:00
120790	f	tobechecked	2035-12-03 00:00:00
120791	f	tobechecked	2035-06-04 00:00:00
120792	f	tobechecked	2035-12-23 00:00:00
120793	f	tobechecked	2034-06-09 00:00:00
120837	t	tobechecked	\N
120838	t	tobechecked	\N
120840	t	tobechecked	\N
120841	t	tobechecked	\N
120857	t	tobechecked	\N
120858	f	tobechecked	\N
120859	t	tobechecked	\N
120860	t	tobechecked	\N
120861	f	tobechecked	2025-12-31 00:00:00
120862	f	tobechecked	2025-12-31 00:00:00
120863	f	tobechecked	2025-12-31 00:00:00
121005	t	tobechecked	\N
121012	t	tobechecked	\N
121021	f	tobechecked	\N
121077	t	tobechecked	\N
121078	t	tobechecked	\N
121079	t	tobechecked	\N
121080	t	tobechecked	\N
121091	t	tobechecked	\N
121104	t	tobechecked	\N
121123	t	tobechecked	\N
121124	t	tobechecked	\N
121125	t	tobechecked	\N
121128	t	tobechecked	\N
121140	t	tobechecked	\N
121179	f	tobechecked	2025-01-01 00:00:00
121190	f	tobechecked	2025-01-01 00:00:00
121192	t	tobechecked	\N
121193	t	tobechecked	\N
121194	t	tobechecked	\N
121195	t	tobechecked	\N
121196	t	tobechecked	\N
121198	t	tobechecked	\N
121203	t	tobechecked	\N
121204	t	tobechecked	\N
121205	t	tobechecked	\N
121208	f	tobechecked	\N
121215	t	tobechecked	\N
121216	t	tobechecked	\N
121226	t	tobechecked	\N
121228	t	tobechecked	\N
121229	t	tobechecked	\N
121237	t	tobechecked	\N
121249	t	tobechecked	\N
121262	t	tobechecked	\N
121266	f	tobechecked	\N
121267	f	tobechecked	\N
121276	t	tobechecked	\N
121280	t	tobechecked	\N
121288	t	tobechecked	\N
121326	f	tobechecked	\N
121327	f	tobechecked	\N
121340	t	tobechecked	\N
121341	f	tobechecked	2034-11-05 00:00:00
121342	f	tobechecked	2038-03-14 00:00:00
121343	f	tobechecked	2039-06-05 00:00:00
121344	f	tobechecked	2035-10-01 00:00:00
121345	f	tobechecked	2037-06-13 00:00:00
121346	f	tobechecked	2038-06-25 00:00:00
121347	f	tobechecked	2037-10-04 00:00:00
121348	f	tobechecked	\N
121349	f	tobechecked	2036-02-28 00:00:00
121350	t	tobechecked	\N
121351	f	tobechecked	2038-10-31 00:00:00
121353	t	tobechecked	\N
121356	f	tobechecked	2035-12-14 00:00:00
121357	f	tobechecked	2037-04-18 00:00:00
121362	f	tobechecked	\N
121363	f	tobechecked	\N
121369	f	tobechecked	\N
121370	f	tobechecked	\N
121371	t	tobechecked	\N
121372	t	tobechecked	\N
121373	t	tobechecked	\N
121374	t	tobechecked	\N
121375	t	tobechecked	\N
121376	t	tobechecked	\N
121377	t	tobechecked	\N
121379	t	tobechecked	\N
121380	t	tobechecked	\N
121381	t	tobechecked	\N
121382	t	tobechecked	\N
121383	t	tobechecked	\N
121384	t	tobechecked	\N
121385	t	tobechecked	\N
121386	t	tobechecked	\N
121389	t	tobechecked	\N
121390	t	tobechecked	\N
121391	t	tobechecked	\N
121393	f	tobechecked	2028-09-15 00:00:00
121394	f	tobechecked	2030-03-01 00:00:00
121395	f	tobechecked	2024-04-11 00:00:00
121396	f	tobechecked	2026-10-31 00:00:00
121397	f	tobechecked	2025-09-29 00:00:00
121398	f	tobechecked	2025-09-18 00:00:00
121399	f	tobechecked	2027-03-01 00:00:00
121400	f	tobechecked	2028-11-28 00:00:00
121401	f	tobechecked	2027-05-27 00:00:00
121402	f	tobechecked	2027-06-17 00:00:00
121403	f	tobechecked	2029-02-20 00:00:00
121404	f	tobechecked	2029-04-05 00:00:00
121405	f	tobechecked	2028-05-27 00:00:00
121406	f	tobechecked	2029-11-12 00:00:00
121407	t	tobechecked	\N
121408	t	tobechecked	\N
121409	t	tobechecked	\N
121410	t	tobechecked	\N
121411	t	tobechecked	\N
121413	t	tobechecked	\N
121414	t	tobechecked	\N
121415	f	tobechecked	\N
121416	t	tobechecked	\N
121417	t	tobechecked	\N
121418	t	tobechecked	\N
121419	f	tobechecked	\N
121420	t	tobechecked	\N
121421	t	tobechecked	\N
121422	t	tobechecked	\N
121423	t	tobechecked	\N
121424	t	tobechecked	\N
121425	t	tobechecked	\N
121426	f	tobechecked	\N
121427	t	tobechecked	\N
121428	t	tobechecked	\N
121429	f	tobechecked	\N
121430	f	tobechecked	\N
121431	f	tobechecked	\N
121432	f	tobechecked	\N
121433	f	tobechecked	\N
121434	t	tobechecked	\N
121435	t	tobechecked	\N
121436	t	tobechecked	\N
121437	t	tobechecked	\N
121438	t	tobechecked	\N
121439	t	tobechecked	\N
121440	t	tobechecked	\N
121441	t	tobechecked	\N
121442	t	tobechecked	\N
121443	f	tobechecked	\N
121444	f	tobechecked	\N
121445	f	tobechecked	\N
121446	t	tobechecked	\N
121447	f	tobechecked	\N
121448	t	tobechecked	\N
121449	t	tobechecked	\N
121450	t	tobechecked	\N
121451	t	tobechecked	\N
121452	t	tobechecked	\N
121453	t	tobechecked	\N
121454	f	tobechecked	\N
121455	t	tobechecked	\N
121456	t	tobechecked	\N
121457	t	tobechecked	\N
121458	t	tobechecked	\N
121459	t	tobechecked	\N
121460	t	tobechecked	\N
121461	f	tobechecked	\N
121462	t	tobechecked	\N
121463	t	tobechecked	\N
121464	t	tobechecked	\N
121465	t	tobechecked	\N
121466	t	tobechecked	\N
121467	t	tobechecked	\N
121468	t	tobechecked	\N
121469	t	tobechecked	\N
121470	t	tobechecked	\N
121471	t	tobechecked	\N
121472	t	tobechecked	\N
121473	t	tobechecked	\N
121474	t	tobechecked	\N
121475	t	tobechecked	\N
121476	t	tobechecked	\N
121477	t	tobechecked	\N
121478	t	tobechecked	\N
121479	t	tobechecked	\N
121480	t	tobechecked	\N
121481	f	tobechecked	\N
121482	t	tobechecked	\N
121483	t	tobechecked	\N
121484	t	tobechecked	\N
121485	t	tobechecked	\N
121486	t	tobechecked	\N
121487	t	tobechecked	\N
121488	t	tobechecked	\N
121489	t	tobechecked	\N
121490	t	tobechecked	\N
121491	t	tobechecked	\N
121492	t	tobechecked	\N
121493	t	tobechecked	\N
121494	t	tobechecked	\N
121495	t	tobechecked	\N
121496	t	tobechecked	\N
121497	t	tobechecked	\N
121498	t	tobechecked	\N
121499	t	tobechecked	\N
121500	t	tobechecked	\N
121501	t	tobechecked	\N
121502	t	tobechecked	\N
121503	t	tobechecked	\N
121504	t	tobechecked	\N
121505	t	tobechecked	\N
121506	t	tobechecked	\N
121507	t	tobechecked	\N
121508	t	tobechecked	\N
121509	t	tobechecked	\N
121510	t	tobechecked	\N
121511	t	tobechecked	\N
121512	t	tobechecked	\N
121513	t	tobechecked	\N
121514	t	tobechecked	\N
121515	f	tobechecked	\N
121516	f	tobechecked	\N
121517	f	tobechecked	\N
121518	f	tobechecked	\N
121519	f	tobechecked	\N
121520	f	tobechecked	\N
121521	f	tobechecked	\N
121522	f	tobechecked	\N
121523	f	tobechecked	\N
121524	f	tobechecked	\N
121525	t	tobechecked	\N
121526	t	tobechecked	\N
121527	t	tobechecked	\N
121528	t	tobechecked	\N
121529	t	tobechecked	\N
121530	t	tobechecked	\N
121531	t	tobechecked	\N
121532	f	tobechecked	\N
121533	f	tobechecked	\N
121534	f	tobechecked	\N
121535	f	tobechecked	\N
121536	f	tobechecked	\N
121537	t	tobechecked	\N
121538	t	tobechecked	\N
121539	f	tobechecked	\N
121540	t	tobechecked	\N
121541	f	tobechecked	\N
121542	t	tobechecked	\N
121543	f	tobechecked	\N
121544	t	tobechecked	\N
121545	t	tobechecked	\N
121546	t	tobechecked	\N
121547	t	tobechecked	\N
121548	t	tobechecked	\N
121549	t	tobechecked	\N
121550	t	tobechecked	\N
121551	t	tobechecked	\N
121552	t	tobechecked	\N
121553	t	tobechecked	\N
121554	t	tobechecked	\N
121555	t	tobechecked	\N
121556	t	tobechecked	\N
121557	t	tobechecked	\N
121558	t	tobechecked	\N
121559	t	tobechecked	\N
121560	t	tobechecked	\N
121561	t	tobechecked	\N
121562	t	tobechecked	\N
121563	t	tobechecked	\N
121564	f	tobechecked	\N
121565	t	tobechecked	\N
121566	f	tobechecked	\N
121567	t	tobechecked	\N
121568	t	tobechecked	\N
121569	t	tobechecked	\N
121570	f	tobechecked	\N
121571	f	tobechecked	\N
121572	f	tobechecked	\N
121573	f	tobechecked	\N
121574	f	tobechecked	\N
121575	f	tobechecked	\N
121576	t	tobechecked	\N
121577	t	tobechecked	\N
121578	t	tobechecked	\N
121579	t	tobechecked	\N
121580	t	tobechecked	\N
121584	t	tobechecked	\N
121585	t	tobechecked	\N
121591	t	tobechecked	\N
121592	t	tobechecked	\N
121593	t	tobechecked	\N
121600	t	tobechecked	\N
121602	t	tobechecked	\N
121606	t	tobechecked	\N
121607	t	tobechecked	\N
121608	t	tobechecked	\N
121644	t	tobechecked	\N
121648	t	tobechecked	\N
121653	t	tobechecked	\N
121654	t	tobechecked	\N
121661	t	tobechecked	\N
121662	t	tobechecked	\N
121663	t	tobechecked	\N
121664	t	tobechecked	\N
121665	t	tobechecked	\N
121672	t	tobechecked	\N
130099	t	tobechecked	\N
130101	f	tobechecked	\N
42753	t	approved	\N
43034	t	tobechecked	\N
42550	t	approved	\N
42547	t	approved	\N
130102	t	tobechecked	\N
42551	f	approved	\N
42576	t	approved	\N
42314	t	approved	\N
43469	t	tobechecked	\N
64182	t	tobechecked	\N
42565	t	approved	\N
113273	t	tobechecked	\N
42754	t	approved	\N
42570	t	approved	\N
43176	t	tobechecked	\N
61321	t	tobechecked	\N
42755	t	approved	\N
43901	t	tobechecked	\N
42758	t	approved	\N
42759	t	approved	\N
8322	t	approved	\N
42760	t	approved	\N
44027	t	approved	\N
130103	t	tobechecked	\N
42779	t	approved	\N
103760	t	tobechecked	\N
43239	f	tobechecked	\N
43242	t	tobechecked	\N
43481	t	tobechecked	\N
8324	t	approved	\N
43700	t	tobechecked	\N
8330	t	approved	\N
44036	t	tobechecked	\N
103770	t	tobechecked	\N
44076	t	approved	\N
42308	t	approved	\N
43841	t	tobechecked	\N
43088	t	tobechecked	\N
43948	t	approved	\N
4767	t	approved	\N
43400	t	tobechecked	\N
43856	t	tobechecked	\N
44196	t	tobechecked	\N
42932	t	tobechecked	\N
10386	t	tobechecked	\N
10608	t	tobechecked	\N
42983	t	tobechecked	\N
43401	t	tobechecked	\N
42418	t	approved	\N
43869	t	tobechecked	\N
43915	t	tobechecked	\N
43883	t	tobechecked	\N
43361	t	tobechecked	\N
43424	t	tobechecked	\N
43425	t	tobechecked	\N
43440	t	tobechecked	\N
43453	t	tobechecked	\N
44214	t	tobechecked	\N
44219	t	tobechecked	\N
44221	t	tobechecked	\N
44222	t	tobechecked	\N
44224	t	tobechecked	\N
44225	t	tobechecked	\N
8592	t	tobechecked	\N
44226	t	tobechecked	\N
43997	t	approved	\N
44000	t	approved	\N
43998	t	approved	\N
42536	t	approved	\N
43999	t	approved	\N
42537	t	approved	\N
42538	t	approved	\N
42539	t	approved	\N
42540	t	approved	\N
42543	t	approved	\N
42545	t	approved	\N
42546	t	approved	\N
42548	t	approved	\N
43275	t	tobechecked	\N
43299	t	tobechecked	\N
43355	t	tobechecked	\N
43384	t	tobechecked	\N
43399	t	tobechecked	\N
43446	t	tobechecked	\N
43447	t	tobechecked	\N
43448	t	tobechecked	\N
43455	t	tobechecked	\N
42864	t	approved	\N
43495	t	tobechecked	\N
42906	t	approved	\N
44001	t	approved	\N
44002	t	approved	\N
44546	t	tobechecked	\N
44003	t	approved	\N
44005	t	approved	\N
44004	t	approved	\N
44547	t	tobechecked	\N
44006	t	approved	\N
44007	t	approved	\N
44008	t	approved	\N
44009	t	approved	\N
43880	t	tobechecked	\N
44548	t	tobechecked	\N
43938	t	tobechecked	\N
43939	t	tobechecked	\N
43940	t	tobechecked	\N
43941	t	tobechecked	\N
44549	t	tobechecked	\N
43942	t	tobechecked	\N
44550	t	tobechecked	\N
4927	t	tobechecked	\N
44562	t	tobechecked	\N
44575	t	tobechecked	\N
4966	t	tobechecked	\N
43339	t	tobechecked	\N
43943	t	tobechecked	\N
43508	t	tobechecked	\N
44596	t	tobechecked	\N
43944	t	tobechecked	\N
43945	t	tobechecked	\N
44238	t	tobechecked	\N
8610	t	tobechecked	\N
44612	t	tobechecked	\N
44624	t	tobechecked	\N
43946	t	tobechecked	\N
43947	t	tobechecked	\N
44350	t	tobechecked	\N
8638	t	tobechecked	\N
44644	t	tobechecked	\N
43521	t	tobechecked	\N
113276	t	tobechecked	\N
44254	t	tobechecked	\N
43533	t	tobechecked	\N
4832	t	tobechecked	\N
44386	t	tobechecked	\N
43546	t	tobechecked	\N
44399	t	tobechecked	\N
43565	t	tobechecked	\N
43587	t	tobechecked	\N
44433	t	tobechecked	\N
4875	t	tobechecked	\N
60120	t	tobechecked	\N
8664	t	tobechecked	\N
4982	t	tobechecked	\N
44282	t	tobechecked	\N
4985	t	tobechecked	\N
43603	t	tobechecked	\N
44467	t	tobechecked	\N
44304	t	tobechecked	\N
44316	t	tobechecked	\N
44487	t	tobechecked	\N
44490	t	tobechecked	\N
43633	t	tobechecked	\N
44503	t	tobechecked	\N
44508	t	tobechecked	\N
44510	t	tobechecked	\N
43635	t	tobechecked	\N
44173	t	tobechecked	\N
43634	t	tobechecked	\N
44511	t	tobechecked	\N
43637	t	tobechecked	\N
44512	t	tobechecked	\N
43643	t	tobechecked	\N
43644	t	tobechecked	\N
43647	t	tobechecked	\N
43648	t	tobechecked	\N
43649	t	tobechecked	\N
43657	t	tobechecked	\N
43658	t	tobechecked	\N
43669	t	tobechecked	\N
130104	t	tobechecked	\N
130105	t	tobechecked	\N
130106	f	tobechecked	\N
130107	f	tobechecked	\N
130108	f	tobechecked	\N
130109	f	tobechecked	\N
\.


--
-- TOC entry 4688 (class 0 OID 17658)
-- Dependencies: 267
-- Data for Name: language_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.language_item (language_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
EN	No-GeolCode-specified	english	englisch	anglais	englais	inglese	english	Asset in English	Asset in Englisch	Asset en anglais		Asset in inglese	Asset in English
IT	No-GeolCode-specified	italian	italienisch	italien	talian	italiano	italian	Asset in Italian	Asset in Italienisch	Asset en italien		Elemento in italiano	Asset in Italian
FR	No-GeolCode-specified	french	französisch	français	franzos	francese	french	Asset in French	Asset in Französisch	Asset en français		Elemento in francese	Asset in French
DE	No-GeolCode-specified	german	deutsch	allemand	tudestg	tedesco	german	Asset in German	Asset in Deutsch	Asset en allemand		Elemento in tedesco	Asset in German
other	No-GeolCode-specified	other languages	andere Sprachen	autres langues	autras linguas	altre lingue	other languages	Asset in other languages	Asset in anderer Sprachen	Assets dans d'autres langues		Elemento in altre lingue	Asset in other languages
NUM	No-GeolCode-specified	numeric	numerisch	numérique		numerico	numeric	Asset with numerical structure, e.g. programme code, configurations	Asset mit numerischem Aufbau, wie z.B. Programmcode, Konfigurationen	Asset à structure numérique, p. ex. code de programme, configurations		Elemento con struttura numerica, ad es. codice programma, configurazioni	Asset with numerical structure, e.g. programme code, configurations
\.


--
-- TOC entry 4689 (class 0 OID 17663)
-- Dependencies: 268
-- Data for Name: legal_doc; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.legal_doc (legal_doc_id, asset_id, title, legal_doc_item_code) FROM stdin;
\.


--
-- TOC entry 4690 (class 0 OID 17668)
-- Dependencies: 269
-- Data for Name: legal_doc_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.legal_doc_item (legal_doc_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
federalData	No-GeolCode-specified	Federal data	Bundesdaten	Données fédérales		Dati federali	Federal data	Data to which the Confederation holds the rights 	Daten, an welchen der Bund die Rechte besitzt 	Données pour lesquelles la Confédération possède des droits 		Dati di cui la Confederazione detiene i diritti 	Data to which the Confederation holds the rights 
permissionForm	No-GeolCode-specified	permissionForm	Einwilligungsformular	Formulaire de consentement		Modulo di consenso	Consent form	Legally binding consent form	Rechtlich verbindliches Einwilligungsformular	Formulaire de consentement juridiquement contraignant		Modulo di consenso legalmente vincolante	Legally binding consent form
contract	No-GeolCode-specified	contract	Vertrag	Contrat		Contratto	Contract	Legally binding contract	Rechtlich verbindlicher Vertrag	Contrat juridiquement contraignant		Contratto legalmente vincolante	Legally binding contract
other	No-GeolCode-specified	other	Andere	Autres		Altro	Other	Other legally binding document (e.g. e-mail)	Anderes rechtsgültiges Dokument (z.B. E-Mail)	Autre document juridiquement valable (par ex. e-mail)		Altro documento giuridicamente vincolante (ad es. e-mail)	Other legally binding document (e.g. e-mail)
\.


--
-- TOC entry 4692 (class 0 OID 17674)
-- Dependencies: 271
-- Data for Name: man_cat_label_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.man_cat_label_item (man_cat_label_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
energyRessources	No-GeolCode-specified	Energy ressources	Geoenergie, Geothermie, Energierohstoffe (Erdöl/Erdgas/Kohle)	Géoénergie, géothermie, matières premières énergétiques (pétrole/gaz naturel/charbon)		Geoenergia, energia geotermica, risorse energetiche (petrolio/gas naturale/carbone)	Geoenergy, geothermal energy, energy resources (oil/natural gas/coal)	Geoenergy assets, e.g. geothermal energy, energy resources (oil, gas, coal), etc.	Assets zum Thema Geoenergie, wie z.B. Geothermie, Energierohstoffe (Erdöl, Erdgas, Kohle), etc.	Assets sur le thème des géoénergies, p. ex. géothermie, matières premières énergétiques (pétrole, gaz naturel, charbon), etc.		Elementi sul tema della geoenergia, ad esempio energia geotermica, risorse energetiche (petrolio, gas, carbone), ecc.	Geoenergy assets, e.g. geothermal energy, energy resources (oil, gas, coal), etc.
science	No-GeolCode-specified	Science	Wissenschaftl. Abschlussarbeiten	Travaux scientifiques de fin d'études		Tesi scientifiche	Scientific theses	Assets in the form of a scientific thesis	Assets ins Form einer  wissenschaftl. Abschlussarbeiten	Assets sous la forme d'un travail scientifique de fin d'études		Elementi in  forma di tesi scientifica	Assets in the form of a scientific thesis
geotechnics	No-GeolCode-specified	Geotechnics	Geotechnik	Géotechnique		Geotecnica	Geotechnics	Assets on the topic of geotechnics	Assets zum Thema Geotechnik	Assets sur le thème de la géotechnique		Elementi sul tema della geotecnica	Assets on the topic of geotechnics
geophysics	No-GeolCode-specified	Geophysics	Geophysik	Géophysique		Geofisica	Geophysics	Assets on the topic of geophysics	Assets zum Thema Geophysik	Assets sur le thème de la géophysique		Elementi sul tema della geofisica	Assets on the topic of geophysics
borehole	No-GeolCode-specified	Borehole	Bohrungen	Forages		Perforazioni	Boreholes	Assets on the topic of boreholes, e.g. borehole profiles and reports	Assets zum Thema Bohrungen, z.B. Bohrprofile und Berichte zu Bohrungen	Assets sur le thème des forages, p. ex. profils et rapports de forage		Elementi sul tema della perforazione, ad esempio profili e rpporti di perforazione.	Assets on the topic of boreholes, e.g. borehole profiles and reports
other	No-GeolCode-specified	Other	Andere	Autres		Altro	Other	Assets on other topics not covered by the values in this list	Assets zu anderen Themen, die nicht mit den Werten dieser Liste abgedeckt sind	Assets sur d'autres thèmes qui ne sont pas couverts par les valeurs de cette liste		Elementi su altri argomenti non coperti dai valori di questo elenco	Assets on other topics not covered by the values in this list
naturalHazards	No-GeolCode-specified	Natural hazards	Naturgefahren	Dangers naturels		Rischi naturali	Natural hazards	Assets on the topic of natural hazards	Assets zum Thema Naturgefahren	Assets sur le thème des dangers naturels		Elementi sul tema dei rischi naturali	Assets on the topic of natural hazards
hydrogeology	No-GeolCode-specified	Hydrogeology	Hydrogeologie	Hydrogéologie		Idrogeologia	Hydrogeology	Assets on the topic of hydrogeology	Assets zum Thema Hydrogeologie	Assets sur le thème de l'hydrogéologie		Elementi sul tema dell'idrogeologia	Assets on the topic of hydrogeology
pollution	No-GeolCode-specified	Pollution	Altlasten	Sites contaminés		Siti contaminati	Contaminated sites	Assets on the topic of contaminated sites	Assets zum Thema Altlasten	Assets sur le thème des sites contaminés		Elementi sul tema dei siti contaminati	Assets on the topic of contaminated sites
mineralRessources	No-GeolCode-specified	Mineralressources	Mineralische Rohstoffe	Matières premières minérales		Risorse minerali	Mineral Resources	Assets on the topic of mineral resources (incl. mining, quarries, gravel pits, etc.)	Assets zum Thema Mineralische Rohstoffe (inkl. Bergbau, Steinbruch, Kiesgrube etc.)	Assets sur le thème des ressources minérales (y compris exploitation minière, carrières, gravières, etc.)		Elementi sul tema delle risorse minerali (incluse miniere, cave di roccia, cave di ghiaia, ecc.)	Assets on the topic of mineral resources (incl. mining, quarries, gravel pits, etc.)
prospection	No-GeolCode-specified	Prospection	Prospektion (z.B. Rohstoffe)	Prospection (p. ex. matières premières)		Prospezione (ad es. materie prime)	Prospecting (e.g. raw materials)	Assets on the topic of prospecting, e.g. of mineral raw materials	Assets zum Thema Prospektion, wie z.B. von mineralischen Rohstoffen	Assets sur le thème de la prospection, p. ex. matières premières minérales		Elementi sul tema della prospezione, ad esempio di materie prime minerali	Assets on the topic of prospecting, e.g. of mineral raw materials
exploration	No-GeolCode-specified	Exploration	Exploration	Exploration		Esplorazione	Exploration	Assets on the topic of exploration, e.g. of minerals and raw materials	Assets zum Thema Exploration, wie z.B. von mineralischen Rohstoffen	Assets sur le thème de l'exploration, p. ex. ressources minérales		Elementi sul tema dell'esplorazione, ad es. di materie prime minerali	Assets on the topic of exploration, e.g. of minerals and raw materials
\.


--
-- TOC entry 4693 (class 0 OID 17679)
-- Dependencies: 272
-- Data for Name: man_cat_label_ref; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.man_cat_label_ref (asset_id, man_cat_label_item_code) FROM stdin;
44382	geotechnics
44382	hydrogeology
\.


--
-- TOC entry 4694 (class 0 OID 17684)
-- Dependencies: 273
-- Data for Name: nat_rel_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.nat_rel_item (nat_rel_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
geolWasteDisp	No-GeolCode-specified	geolWasteDisp	Geologisches Tiefenlager	Dépôts en couches géologiques profondes		Deposito geologico profondo	Deep geological repository	Asset is related to deep geological repositories in Switzerland	Asset steht im Zusammenahng mit Geologischen Tiefenlagern in der Schweiz	Asset en relation avec des dépôts en couches géologiques profondes en Suisse		L'elemento è associato ai depositi geologici profondi in Svizzera	Asset is related to deep geological repositories in Switzerland
partiConf	No-GeolCode-specified	partiConf	Projekte mit Bundesbeteiligung	Projets avec participation de la Confédération		Progetti a partecipazione federale	Projects with federal participation	Asset has been constructed on behalf of or with the participation of the federal government (federal participation).	Asset ist im Auftrag oder mit Beteiligung des Bundes (Bundesbeteiligung) erstellt worden	Asset réalisé sur mandat ou avec la participation de la Confédération (participation fédérale).		L'elemento è stato realizzato per conto o con la partecipazione del governo federale (partecipazione federale).	Asset has been constructed on behalf of or with the participation of the federal government (federal participation).
projConfEnterprise	No-GeolCode-specified	projConfEnterprise	Projekte bundesnaher Betriebe	Projets d'entreprises proches de la Confédération		Progetti di aziende prossime alla Confederazione	Projects with federally associated participation	Asset has been constructed on behalf of or with the participation of a government-affiliated company, e.g. the Swiss Federal Railways (SBB).	Asset ist im Auftrag oder mit Beteiligung eines bundesnahen Betriebes, wie z.B. der SBB, erstellt worden	Asset réalisé sur mandat ou avec la participation d'une entreprise proche de la Confédération, p. ex. CFF		L'elemento è stato realizzato per conto o con la partecipazione di un'azienda pubblica, ad esempio le Ferrovie Federali Svizzere (FFS).	Asset has been constructed on behalf of or with the participation of a government-affiliated company, e.g. the Swiss Federal Railways (SBB).
boreholesGt100	No-GeolCode-specified	boreholesGt100	Bohrungen grösser 100 m	Forages de plus de 100 m		Perforazioni superiori a 100 m	Boreholes greater than 100 m	Asset is associated with a borehole >100 m deep.	Asset steht im Zusammenhang mit einer Bohrung >100 m Tiefe	Asset en relation avec un forage >100 m de profondeur		L'elemento è associato a una perforazione profonda oltre i 100 metri.	Asset is associated with a borehole >100 m deep.
sgtk_FGS	No-GeolCode-specified	sgtk_FGS	Resultate der SGTK und FGS	Résultats de la SGTK et de la FGS		Risultati della SGTK o 'FGS	Results of the SGTK and FGS	Asset is related to results of the SGTK and the FGS	Asset steht im Zusammenhang mit Resultaten der SGTK und der FGS	Asset en relation avec des résultats de la SGTK et de la FGS		L'elemento è legato ai risultati della SGTK o FGS.	Asset is related to results of the SGTK and the FGS
sgpk	No-GeolCode-specified	sgpk	Resultate SGPK	Résultats de la SGPK		Risultati della SGPK	Results of SGPK	Asset is related to the results of the SGPK	Asset steht im Zusammenhang mit Resultaten der SGPK	Asset en relation avec les résultats de la SGPK		L'elemento è legato ai risultati della SGPK	Asset is related to the results of the SGPK
prospecExplor	No-GeolCode-specified	prospecExplor	Prospektion und Förderung von Rohstoffen aus dem Energiebereich	Prospection et extraction de matières premières dans le domaine de l'énergie		Prospezione o estrazione di materie prime per il settore energetico	Prospecting and extraction of raw materials from the energy sector	Asset is related to the prospecting and extraction of raw materials in the energy sector.	Asset steht im Zusammenhang mit der Prospektion und Förderung von Rohstoffen aus dem Energiebereich	Asset en relation avec la prospection et l'extraction de matières premières dans le domaine de l'énergie		L'elemento è legato alla ricerca o all'estrazione di materie prime per il settore energetico.	Asset is related to the prospecting and extraction of raw materials in the energy sector.
projNatRel	No-GeolCode-specified	projNatRel	Projekte mit nationaler Ausstrahlung	Projets d'envergure nationale		Progetti con impatto nazionale	Projects with national impact	Asset is related to projects with national impact	Asset steht im Zusammenhang mit Projekten mit nationaler Ausstrahlung	Asset lié à des projets d'envergure nationale		L'elemento è legato a progetti con impatto nazionale	Asset is related to projects with national impact
specScienInt	No-GeolCode-specified	specScienInt	Besonderes wissenschaftliches Interesse	Intérêt scientifique particulier		Interesse scientifico speciale	Special scientific interest	Asset has a specific scientific interest	Asset hat ein besonderes wissenschaftliches Interesse	Asset avec un intérêt scientifique particulier		L'elemento ha un interesse scientifico particolare	Asset has a specific scientific interest
\.


--
-- TOC entry 4695 (class 0 OID 17689)
-- Dependencies: 274
-- Data for Name: pub_channel_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.pub_channel_item (pub_channel_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
conference	No-GeolCode-specified	conference	Konferenz	Conférence		Conferenza	Conference	Conference	Konferenz	Conférence		Conferenza	Conference
professionalJournal	No-GeolCode-specified	professionalJournal	Fachzeitschrift	Revue spécialisée		Rivista specializzata	Journal	Technical journal	Fachzeitschrift	Revue spécialisée		Rivista specializzata	Technical journal
monograph	No-GeolCode-specified	monograph	Monographie	Monographie		Monografia	Monograph	Monograph, e.g. book, textbook, reports of national geology, etc.	Monografie, z.B. Buch, Lehrbuch, Berichte der Landesgeologie, etc.	Monographie, p. ex. livre, manuel, rapports du Service géologique national, etc.		Monografia, ad esempio libro, libro di testo, rapporti del servizion geologico nazionale, ecc.	Monograph, e.g. book, textbook, reports of national geology, etc.
internet	No-GeolCode-specified	internet	Internet	Internet		Internet	Internet	Internet	Internet	Internet		Internet	Internet
mapGeoAdmin	No-GeolCode-specified	mapGeoAdmin	map.geo.admin.ch	map.geo.admin.ch	map.geo.admin.ch	map.geo.admin.ch	map.geo.admin.ch	Federal Geoportal: https://map.geo.admin.ch	Geoportal des Bundes: https://map.geo.admin.ch	Géoportail de la Confédération : https://map.geo.admin.ch		Geoportale federale: https://map.geo.admin.ch	Federal Geoportal: https://map.geo.admin.ch
opendataSwiss	No-GeolCode-specified	opendata.swiss	opendata.swiss	opendata.swiss	opendata.swiss	opendata.swiss	opendata.swiss	OpenData portal: https://opendata.swiss	OpenData-Portal: https://opendata.swiss	Portail OpenData : https://opendata.swiss		Portale OpenData: https://opendata.swiss	OpenData portal: https://opendata.swiss
undiff	No-GeolCode-specified	undiff	Undifferenziert	Indifférencié		Indifferenziato	Undifferentiated	Unspecifiable publication channel	Nicht spezifizierbarer Publikationskanal	Canal de publication non précisé		Canale di pubblicazione non specificabile	Unspecifiable publication channel
swissgeol	No-GeolCode-specified	swissgeol	swissgeol.ch	swissgeol.ch	swissgeol.ch	swissgeol.ch	swissgeol.ch	Data viewer of the swiss subsurface: https://swissgeol.ch	Datenviewer des Schweizer Untergrunds: https://swissgeol.ch	Visualiseur de données du sous-sol suisse: https://swissgeol.ch		Visualizzatore di dati del sottosuolo svizzero: https://swissgeol.ch	Data viewer of the swiss subsurface: https://swissgeol.ch
\.


--
-- TOC entry 4696 (class 0 OID 17694)
-- Dependencies: 275
-- Data for Name: public_use; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.public_use (public_use_id, is_available, status_asset_use_item_code, start_availability_date) FROM stdin;
130108	f	tobechecked	\N
\.


--
-- TOC entry 4698 (class 0 OID 17700)
-- Dependencies: 277
-- Data for Name: publication; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.publication (publication_id, pub_channel_item_code, publication_date, description, link) FROM stdin;
\.


--
-- TOC entry 4310 (class 0 OID 16705)
-- Dependencies: 218
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 4700 (class 0 OID 17706)
-- Dependencies: 279
-- Data for Name: status_asset_use_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.status_asset_use_item (status_asset_use_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
tobechecked	No-GeolCode-specified	to be checked	Zu prüfen	À vérifier		Da testare	To be checked	Terms of use of the asset need to be checked	Nutzungsbedingungen des Assets müssen geprüft werden	Les conditions d'utilisation de l'asset doivent être vérifiées		Le condizioni di utilizzo dell'elemento devono essere valutate.	Terms of use of the asset need to be checked
underclarification	No-GeolCode-specified	under clarification	In Prüfung	En cours de vérification		In esame	Currently being checked	Terms of use of the asset are currently being checked	Nutzungsbedingungen des Assets werden zurzeit geprüft	Les conditions d'utilisation de l'asset sont en cours de vérification		Le condizioni di utilizzo dell'elemento sono attualmente in fase di valutazione	Terms of use of the asset are currently being checked
approved	No-GeolCode-specified	approved	Finalisiert	Finalisé		Finalizzato	Finalised	Terms of use of the asset are available and confirmed	Nutzungsbedingungen des Assets liegen vor und sind bestätigt	Les conditions d'utilisation de l'asset sont disponibles et confirmées		Le condizioni di utilizzo dell'elemento sono disponibili e confermate	Terms of use of the asset are available and confirmed
\.


--
-- TOC entry 4701 (class 0 OID 17711)
-- Dependencies: 280
-- Data for Name: status_work; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.status_work (status_work_id, asset_id, status_work_item_code, status_work_date, processor) FROM stdin;
219886	44382	initiateAsset	2024-02-20 15:20:33.928	\N
\.


--
-- TOC entry 4702 (class 0 OID 17716)
-- Dependencies: 281
-- Data for Name: status_work_item; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.status_work_item (status_work_item_code, geol_code, name, name_de, name_fr, name_rm, name_it, name_en, description, description_de, description_fr, description_rm, description_it, description_en) FROM stdin;
initiateAsset	No-GeolCode-specified	Initially edited	Ersterfassung Asset	Saisie initiale		Acquisizione iniziale dell'elemento	Initial capture asset	Asset is derived from initial capture in the system	Ersterfassung des Assets im System	Première saisie de l'asset dans le système		L'elemento é inserito per la prima volta nel sistema	Asset is derived from initial capture in the system
edited	No-GeolCode-specified	Edited	Bearbeitet	Traité dans le système		Modificato	Processed	Asset is processed in the system	Asset ist im System bearbeitet	L'asset a été traité dans le système		L'elemento é elaborato dal sistema	Asset is processed in the system
importedOld	No-GeolCode-specified	Old data imported	Importierte Altdaten	Import d'anciennes données		Importazione di dati legacy	Imported legacy data	Asset originates from imported legacy data (InfoGeol)	Asset stammt von importieren Altdaten (InfoGeol) ab	L'asset provient de données anciennes importées (InfoGeol)		L'elemento proviene da dati legacy importati (InfoGeol)	Asset originates from imported legacy data (InfoGeol)
docClassified	No-GeolCode-specified	Document classified	Dokument klassifiziert	Document classé		Documento classificato	Document classified	Asset is assigned to a thematic class	Asset ist einer thematischen Klasse zugewiesen	L'asset a été attribué à une classe thématique		L'elemento è assegnato a una classe tematica	Asset is assigned to a thematic class
objectsExtracted	No-GeolCode-specified	Objects extracted	Objekte extrahiert	Objets extraits		Oggetti estratti	Objects extracted	Objects extracted from asset	Aus Asset wurden Objekte extrahiert	Des objets ont été extraits de l'asset		Degli oggetti sono stati estratti dall'elemento	Objects extracted from asset
OCRprocessed	No-GeolCode-specified	OCR processed	OCR prozessiert	Traité par OCR		Elaborazione OCR	OCR processed	OCR has been performed for asset	Für Asset wurde OCR ausgeführt	L'asset a été traité par OCR		L'OCR è stato eseguito per gli elementi	OCR has been performed for asset
importedDigi	No-GeolCode-specified	Imported digitisation	Importierte Digitalisierung	Numérisation importée		Digitalizzazione importata	Imported digitised	Asset is derived from imported digital data (digi.swissgeol.ch)	Asset stammt von importierten digitalen Daten ab (digi.swissgeol.ch)	L'asset provient de données numériques importées (digi.swissgeol.ch)		L'elemento deriva da dati digitali importati (digi.swissgeol.ch)	Asset is derived from imported digital data (digi.swissgeol.ch)
published	No-GeolCode-specified	published	Publiziert	Publié		Pubblicato	Published	Asset is published	Asset ist publiziert	L'asset est publié		L'elemento è pubblicato	Asset is published
\.


--
-- TOC entry 4652 (class 0 OID 17522)
-- Dependencies: 230
-- Data for Name: study_area; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.study_area (study_area_id, asset_id, geom_quality_item_code, geom) FROM stdin;
\.


--
-- TOC entry 4653 (class 0 OID 17527)
-- Dependencies: 231
-- Data for Name: study_location; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.study_location (study_location_id, asset_id, geom_quality_item_code, geom) FROM stdin;
53107	44382	unkown	0101000020080800002731088C8C4D4441D34D6250A9193241
\.


--
-- TOC entry 4654 (class 0 OID 17532)
-- Dependencies: 232
-- Data for Name: study_trace; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.study_trace (study_trace_id, asset_id, geom_quality_item_code, geom) FROM stdin;
\.


--
-- TOC entry 4707 (class 0 OID 17725)
-- Dependencies: 286
-- Data for Name: type_nat_rel; Type: TABLE DATA; Schema: public; Owner: asset-swissgeol
--

COPY public.type_nat_rel (type_nat_rel_id, asset_id, nat_rel_item_code) FROM stdin;
\.


--
-- TOC entry 4735 (class 0 OID 0)
-- Dependencies: 226
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1162, true);


--
-- TOC entry 4736 (class 0 OID 0)
-- Dependencies: 235
-- Name: asset_asset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.asset_asset_id_seq', 44382, true);


--
-- TOC entry 4737 (class 0 OID 0)
-- Dependencies: 239
-- Name: asset_format_composition_asset_format_composition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.asset_format_composition_asset_format_composition_id_seq', 1, true);


--
-- TOC entry 4738 (class 0 OID 0)
-- Dependencies: 243
-- Name: asset_kind_composition_asset_kind_composition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.asset_kind_composition_asset_kind_composition_id_seq', 1, true);


--
-- TOC entry 4739 (class 0 OID 0)
-- Dependencies: 246
-- Name: asset_object_info_asset_object_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.asset_object_info_asset_object_info_id_seq', 1, true);


--
-- TOC entry 4740 (class 0 OID 0)
-- Dependencies: 252
-- Name: auto_cat_auto_cat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.auto_cat_auto_cat_id_seq', 1, true);


--
-- TOC entry 4741 (class 0 OID 0)
-- Dependencies: 256
-- Name: contact_contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.contact_contact_id_seq', 1854, true);


--
-- TOC entry 4742 (class 0 OID 0)
-- Dependencies: 259
-- Name: file_file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.file_file_id_seq', 14824, true);


--
-- TOC entry 4743 (class 0 OID 0)
-- Dependencies: 262
-- Name: id_id_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.id_id_id_seq', 130305, true);


--
-- TOC entry 4744 (class 0 OID 0)
-- Dependencies: 264
-- Name: internal_project_internal_project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.internal_project_internal_project_id_seq', 1, true);


--
-- TOC entry 4745 (class 0 OID 0)
-- Dependencies: 266
-- Name: internal_use_internal_use_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.internal_use_internal_use_id_seq', 130109, true);


--
-- TOC entry 4746 (class 0 OID 0)
-- Dependencies: 270
-- Name: legal_doc_legal_doc_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.legal_doc_legal_doc_id_seq', 1, true);


--
-- TOC entry 4747 (class 0 OID 0)
-- Dependencies: 276
-- Name: public_use_public_use_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.public_use_public_use_id_seq', 130108, true);


--
-- TOC entry 4748 (class 0 OID 0)
-- Dependencies: 278
-- Name: publication_publication_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.publication_publication_id_seq', 1, true);


--
-- TOC entry 4749 (class 0 OID 0)
-- Dependencies: 282
-- Name: status_work_status_work_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.status_work_status_work_id_seq', 219886, true);


--
-- TOC entry 4750 (class 0 OID 0)
-- Dependencies: 283
-- Name: study_area_study_area_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.study_area_study_area_id_seq', 33658, true);


--
-- TOC entry 4751 (class 0 OID 0)
-- Dependencies: 284
-- Name: study_location_study_location_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.study_location_study_location_id_seq', 53107, true);


--
-- TOC entry 4752 (class 0 OID 0)
-- Dependencies: 285
-- Name: study_trace_study_trace_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.study_trace_study_trace_id_seq', 331, true);


--
-- TOC entry 4753 (class 0 OID 0)
-- Dependencies: 287
-- Name: type_nat_rel_type_nat_rel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asset-swissgeol
--

SELECT pg_catalog.setval('public.type_nat_rel_type_nat_rel_id_seq', 4214, true);


--
-- TOC entry 4344 (class 2606 OID 17751)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4347 (class 2606 OID 17753)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (provider, id);


--
-- TOC entry 4350 (class 2606 OID 17755)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 4355 (class 2606 OID 17757)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4363 (class 2606 OID 17759)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4365 (class 2606 OID 17761)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4378 (class 2606 OID 17763)
-- Name: asset_contact asset_contact_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_contact
    ADD CONSTRAINT asset_contact_pkey PRIMARY KEY (asset_id, contact_id, role);


--
-- TOC entry 4380 (class 2606 OID 17765)
-- Name: asset_file asset_file_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_file
    ADD CONSTRAINT asset_file_pkey PRIMARY KEY (asset_id, file_id);


--
-- TOC entry 4382 (class 2606 OID 17767)
-- Name: asset_format_composition asset_format_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition
    ADD CONSTRAINT asset_format_composition_pkey PRIMARY KEY (asset_format_composition_id);


--
-- TOC entry 4384 (class 2606 OID 17769)
-- Name: asset_format_item asset_format_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_item
    ADD CONSTRAINT asset_format_item_pkey PRIMARY KEY (asset_format_item_code);


--
-- TOC entry 4386 (class 2606 OID 17771)
-- Name: asset_internal_project asset_internal_project_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_internal_project
    ADD CONSTRAINT asset_internal_project_pkey PRIMARY KEY (asset_id, internal_project_id);


--
-- TOC entry 4388 (class 2606 OID 17773)
-- Name: asset_kind_composition asset_kind_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition
    ADD CONSTRAINT asset_kind_composition_pkey PRIMARY KEY (asset_kind_composition_id);


--
-- TOC entry 4390 (class 2606 OID 17775)
-- Name: asset_kind_item asset_kind_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_item
    ADD CONSTRAINT asset_kind_item_pkey PRIMARY KEY (asset_kind_item_code);


--
-- TOC entry 4392 (class 2606 OID 17777)
-- Name: asset_object_info asset_object_info_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info
    ADD CONSTRAINT asset_object_info_pkey PRIMARY KEY (asset_object_info_id);


--
-- TOC entry 4376 (class 2606 OID 17779)
-- Name: asset asset_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_pkey PRIMARY KEY (asset_id);


--
-- TOC entry 4394 (class 2606 OID 17781)
-- Name: asset_publication asset_publication_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_publication
    ADD CONSTRAINT asset_publication_pkey PRIMARY KEY (asset_id, publication_id);


--
-- TOC entry 4398 (class 2606 OID 17783)
-- Name: asset_user_favourite asset_user_favourite_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user_favourite
    ADD CONSTRAINT asset_user_favourite_pkey PRIMARY KEY (asset_user_id, asset_id);


--
-- TOC entry 4396 (class 2606 OID 17785)
-- Name: asset_user asset_user_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user
    ADD CONSTRAINT asset_user_pkey PRIMARY KEY (id);


--
-- TOC entry 4400 (class 2606 OID 17787)
-- Name: asset_x_asset_y asset_x_asset_y_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_x_asset_y
    ADD CONSTRAINT asset_x_asset_y_pkey PRIMARY KEY (asset_x_id, asset_y_id);


--
-- TOC entry 4404 (class 2606 OID 17789)
-- Name: auto_cat_label_item auto_cat_label_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat_label_item
    ADD CONSTRAINT auto_cat_label_item_pkey PRIMARY KEY (asset_cat_label_item_code);


--
-- TOC entry 4402 (class 2606 OID 17791)
-- Name: auto_cat auto_cat_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat
    ADD CONSTRAINT auto_cat_pkey PRIMARY KEY (auto_cat_id);


--
-- TOC entry 4406 (class 2606 OID 17793)
-- Name: auto_object_cat_item auto_object_cat_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_object_cat_item
    ADD CONSTRAINT auto_object_cat_item_pkey PRIMARY KEY (auto_object_cat_item_code);


--
-- TOC entry 4410 (class 2606 OID 17795)
-- Name: contact_kind_item contact_kind_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact_kind_item
    ADD CONSTRAINT contact_kind_item_pkey PRIMARY KEY (contact_kind_item_code);


--
-- TOC entry 4408 (class 2606 OID 17797)
-- Name: contact contact_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY (contact_id);


--
-- TOC entry 4413 (class 2606 OID 17799)
-- Name: file file_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (file_id);


--
-- TOC entry 4415 (class 2606 OID 17801)
-- Name: geom_quality_item geom_quality_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.geom_quality_item
    ADD CONSTRAINT geom_quality_item_pkey PRIMARY KEY (geom_quality_item_code);


--
-- TOC entry 4417 (class 2606 OID 17803)
-- Name: id id_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.id
    ADD CONSTRAINT id_pkey PRIMARY KEY (id_id);


--
-- TOC entry 4419 (class 2606 OID 17805)
-- Name: internal_project internal_project_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_project
    ADD CONSTRAINT internal_project_pkey PRIMARY KEY (internal_project_id);


--
-- TOC entry 4421 (class 2606 OID 17807)
-- Name: internal_use internal_use_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_use
    ADD CONSTRAINT internal_use_pkey PRIMARY KEY (internal_use_id);


--
-- TOC entry 4423 (class 2606 OID 17809)
-- Name: language_item language_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.language_item
    ADD CONSTRAINT language_item_pkey PRIMARY KEY (language_item_code);


--
-- TOC entry 4427 (class 2606 OID 17811)
-- Name: legal_doc_item legal_doc_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc_item
    ADD CONSTRAINT legal_doc_item_pkey PRIMARY KEY (legal_doc_item_code);


--
-- TOC entry 4425 (class 2606 OID 17813)
-- Name: legal_doc legal_doc_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc
    ADD CONSTRAINT legal_doc_pkey PRIMARY KEY (legal_doc_id);


--
-- TOC entry 4429 (class 2606 OID 17815)
-- Name: man_cat_label_item man_cat_label_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.man_cat_label_item
    ADD CONSTRAINT man_cat_label_item_pkey PRIMARY KEY (man_cat_label_item_code);


--
-- TOC entry 4432 (class 2606 OID 17817)
-- Name: nat_rel_item nat_rel_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.nat_rel_item
    ADD CONSTRAINT nat_rel_item_pkey PRIMARY KEY (nat_rel_item_code);


--
-- TOC entry 4434 (class 2606 OID 17819)
-- Name: pub_channel_item pub_channel_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.pub_channel_item
    ADD CONSTRAINT pub_channel_item_pkey PRIMARY KEY (pub_channel_item_code);


--
-- TOC entry 4436 (class 2606 OID 17821)
-- Name: public_use public_use_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.public_use
    ADD CONSTRAINT public_use_pkey PRIMARY KEY (public_use_id);


--
-- TOC entry 4438 (class 2606 OID 17823)
-- Name: publication publication_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT publication_pkey PRIMARY KEY (publication_id);


--
-- TOC entry 4440 (class 2606 OID 17825)
-- Name: status_asset_use_item status_asset_use_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_asset_use_item
    ADD CONSTRAINT status_asset_use_item_pkey PRIMARY KEY (status_asset_use_item_code);


--
-- TOC entry 4444 (class 2606 OID 17827)
-- Name: status_work_item status_work_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work_item
    ADD CONSTRAINT status_work_item_pkey PRIMARY KEY (status_work_item_code);


--
-- TOC entry 4442 (class 2606 OID 17829)
-- Name: status_work status_work_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work
    ADD CONSTRAINT status_work_pkey PRIMARY KEY (status_work_id);


--
-- TOC entry 4368 (class 2606 OID 17831)
-- Name: study_area study_area_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area
    ADD CONSTRAINT study_area_pkey PRIMARY KEY (study_area_id);


--
-- TOC entry 4371 (class 2606 OID 17833)
-- Name: study_location study_location_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location
    ADD CONSTRAINT study_location_pkey PRIMARY KEY (study_location_id);


--
-- TOC entry 4374 (class 2606 OID 17835)
-- Name: study_trace study_trace_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace
    ADD CONSTRAINT study_trace_pkey PRIMARY KEY (study_trace_id);


--
-- TOC entry 4446 (class 2606 OID 17837)
-- Name: type_nat_rel type_nat_rel_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.type_nat_rel
    ADD CONSTRAINT type_nat_rel_pkey PRIMARY KEY (type_nat_rel_id);


--
-- TOC entry 4345 (class 1259 OID 17838)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 4348 (class 1259 OID 17839)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4351 (class 1259 OID 17840)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 4352 (class 1259 OID 17841)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 4353 (class 1259 OID 17842)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 4356 (class 1259 OID 17843)
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_token_idx ON auth.refresh_tokens USING btree (token);


--
-- TOC entry 4357 (class 1259 OID 17844)
-- Name: refresh_tokens_token_unique; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token);


--
-- TOC entry 4358 (class 1259 OID 17845)
-- Name: schema_migrations_version_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX schema_migrations_version_idx ON auth.schema_migrations USING btree (version);


--
-- TOC entry 4359 (class 1259 OID 17846)
-- Name: users_email_key; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX users_email_key ON auth.users USING btree (email);


--
-- TOC entry 4360 (class 1259 OID 17847)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 4361 (class 1259 OID 17848)
-- Name: users_phone_key; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone);


--
-- TOC entry 4411 (class 1259 OID 17849)
-- Name: file_file_name_key; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX file_file_name_key ON public.file USING btree (file_name);


--
-- TOC entry 4430 (class 1259 OID 17850)
-- Name: man_cat_label_ref_asset_id_man_cat_label_item_code_key; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX man_cat_label_ref_asset_id_man_cat_label_item_code_key ON public.man_cat_label_ref USING btree (asset_id, man_cat_label_item_code);


--
-- TOC entry 4366 (class 1259 OID 17851)
-- Name: study_area_geom_idx; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE INDEX study_area_geom_idx ON public.study_area USING gist (geom);


--
-- TOC entry 4369 (class 1259 OID 17852)
-- Name: study_location_geom_idx; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE INDEX study_location_geom_idx ON public.study_location USING gist (geom);


--
-- TOC entry 4372 (class 1259 OID 17853)
-- Name: study_trace_geom_idx; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE INDEX study_trace_geom_idx ON public.study_trace USING gist (geom);


--
-- TOC entry 4447 (class 2606 OID 17854)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4448 (class 2606 OID 17859)
-- Name: refresh_tokens refresh_tokens_parent_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_parent_fkey FOREIGN KEY (parent) REFERENCES auth.refresh_tokens(token);


--
-- TOC entry 4455 (class 2606 OID 17864)
-- Name: asset asset_asset_format_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_format_item_code_fkey FOREIGN KEY (asset_format_item_code) REFERENCES public.asset_format_item(asset_format_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4456 (class 2606 OID 17869)
-- Name: asset asset_asset_kind_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_kind_item_code_fkey FOREIGN KEY (asset_kind_item_code) REFERENCES public.asset_kind_item(asset_kind_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4457 (class 2606 OID 17874)
-- Name: asset asset_asset_main_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_main_id_fkey FOREIGN KEY (asset_main_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4461 (class 2606 OID 17879)
-- Name: asset_contact asset_contact_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_contact
    ADD CONSTRAINT asset_contact_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4462 (class 2606 OID 17884)
-- Name: asset_contact asset_contact_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_contact
    ADD CONSTRAINT asset_contact_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contact(contact_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4463 (class 2606 OID 17889)
-- Name: asset_file asset_file_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_file
    ADD CONSTRAINT asset_file_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4464 (class 2606 OID 17894)
-- Name: asset_file asset_file_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_file
    ADD CONSTRAINT asset_file_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file(file_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4465 (class 2606 OID 17899)
-- Name: asset_format_composition asset_format_composition_asset_format_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition
    ADD CONSTRAINT asset_format_composition_asset_format_item_code_fkey FOREIGN KEY (asset_format_item_code) REFERENCES public.asset_format_item(asset_format_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4466 (class 2606 OID 17904)
-- Name: asset_format_composition asset_format_composition_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition
    ADD CONSTRAINT asset_format_composition_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4467 (class 2606 OID 17909)
-- Name: asset_internal_project asset_internal_project_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_internal_project
    ADD CONSTRAINT asset_internal_project_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4468 (class 2606 OID 17914)
-- Name: asset_internal_project asset_internal_project_internal_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_internal_project
    ADD CONSTRAINT asset_internal_project_internal_project_id_fkey FOREIGN KEY (internal_project_id) REFERENCES public.internal_project(internal_project_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4458 (class 2606 OID 17919)
-- Name: asset asset_internal_use_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_internal_use_id_fkey FOREIGN KEY (internal_use_id) REFERENCES public.internal_use(internal_use_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4469 (class 2606 OID 17924)
-- Name: asset_kind_composition asset_kind_composition_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition
    ADD CONSTRAINT asset_kind_composition_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4470 (class 2606 OID 17929)
-- Name: asset_kind_composition asset_kind_composition_asset_kind_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition
    ADD CONSTRAINT asset_kind_composition_asset_kind_item_code_fkey FOREIGN KEY (asset_kind_item_code) REFERENCES public.asset_kind_item(asset_kind_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4459 (class 2606 OID 17934)
-- Name: asset asset_language_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_language_item_code_fkey FOREIGN KEY (language_item_code) REFERENCES public.language_item(language_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4471 (class 2606 OID 17939)
-- Name: asset_object_info asset_object_info_auto_object_cat_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info
    ADD CONSTRAINT asset_object_info_auto_object_cat_item_code_fkey FOREIGN KEY (auto_object_cat_item_code) REFERENCES public.auto_object_cat_item(auto_object_cat_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4472 (class 2606 OID 17944)
-- Name: asset_object_info asset_object_info_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info
    ADD CONSTRAINT asset_object_info_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file(file_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4460 (class 2606 OID 17949)
-- Name: asset asset_public_use_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_public_use_id_fkey FOREIGN KEY (public_use_id) REFERENCES public.public_use(public_use_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4473 (class 2606 OID 17954)
-- Name: asset_publication asset_publication_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_publication
    ADD CONSTRAINT asset_publication_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4474 (class 2606 OID 17959)
-- Name: asset_publication asset_publication_publication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_publication
    ADD CONSTRAINT asset_publication_publication_id_fkey FOREIGN KEY (publication_id) REFERENCES public.publication(publication_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4476 (class 2606 OID 17964)
-- Name: asset_user_favourite asset_user_favourite_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user_favourite
    ADD CONSTRAINT asset_user_favourite_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4477 (class 2606 OID 17969)
-- Name: asset_user_favourite asset_user_favourite_asset_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user_favourite
    ADD CONSTRAINT asset_user_favourite_asset_user_id_fkey FOREIGN KEY (asset_user_id) REFERENCES public.asset_user(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4475 (class 2606 OID 17974)
-- Name: asset_user asset_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user
    ADD CONSTRAINT asset_user_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4478 (class 2606 OID 17979)
-- Name: asset_x_asset_y asset_x_asset_y_asset_x_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_x_asset_y
    ADD CONSTRAINT asset_x_asset_y_asset_x_id_fkey FOREIGN KEY (asset_x_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4479 (class 2606 OID 17984)
-- Name: asset_x_asset_y asset_x_asset_y_asset_y_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_x_asset_y
    ADD CONSTRAINT asset_x_asset_y_asset_y_id_fkey FOREIGN KEY (asset_y_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4480 (class 2606 OID 17989)
-- Name: auto_cat auto_cat_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat
    ADD CONSTRAINT auto_cat_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4481 (class 2606 OID 17994)
-- Name: auto_cat auto_cat_auto_cat_label_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat
    ADD CONSTRAINT auto_cat_auto_cat_label_item_code_fkey FOREIGN KEY (auto_cat_label_item_code) REFERENCES public.auto_cat_label_item(asset_cat_label_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4482 (class 2606 OID 17999)
-- Name: contact contact_contact_kind_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_contact_kind_item_code_fkey FOREIGN KEY (contact_kind_item_code) REFERENCES public.contact_kind_item(contact_kind_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4483 (class 2606 OID 18004)
-- Name: id id_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.id
    ADD CONSTRAINT id_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4484 (class 2606 OID 18009)
-- Name: internal_use internal_use_status_asset_use_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_use
    ADD CONSTRAINT internal_use_status_asset_use_item_code_fkey FOREIGN KEY (status_asset_use_item_code) REFERENCES public.status_asset_use_item(status_asset_use_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4485 (class 2606 OID 18014)
-- Name: legal_doc legal_doc_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc
    ADD CONSTRAINT legal_doc_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4486 (class 2606 OID 18019)
-- Name: legal_doc legal_doc_legal_doc_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc
    ADD CONSTRAINT legal_doc_legal_doc_item_code_fkey FOREIGN KEY (legal_doc_item_code) REFERENCES public.legal_doc_item(legal_doc_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4487 (class 2606 OID 18024)
-- Name: man_cat_label_ref man_cat_label_ref_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.man_cat_label_ref
    ADD CONSTRAINT man_cat_label_ref_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4488 (class 2606 OID 18029)
-- Name: man_cat_label_ref man_cat_label_ref_man_cat_label_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.man_cat_label_ref
    ADD CONSTRAINT man_cat_label_ref_man_cat_label_item_code_fkey FOREIGN KEY (man_cat_label_item_code) REFERENCES public.man_cat_label_item(man_cat_label_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4489 (class 2606 OID 18034)
-- Name: public_use public_use_status_asset_use_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.public_use
    ADD CONSTRAINT public_use_status_asset_use_item_code_fkey FOREIGN KEY (status_asset_use_item_code) REFERENCES public.status_asset_use_item(status_asset_use_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4490 (class 2606 OID 18039)
-- Name: publication publication_pub_channel_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT publication_pub_channel_item_code_fkey FOREIGN KEY (pub_channel_item_code) REFERENCES public.pub_channel_item(pub_channel_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4491 (class 2606 OID 18044)
-- Name: status_work status_work_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work
    ADD CONSTRAINT status_work_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4492 (class 2606 OID 18049)
-- Name: status_work status_work_status_work_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work
    ADD CONSTRAINT status_work_status_work_item_code_fkey FOREIGN KEY (status_work_item_code) REFERENCES public.status_work_item(status_work_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4449 (class 2606 OID 18054)
-- Name: study_area study_area_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area
    ADD CONSTRAINT study_area_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4450 (class 2606 OID 18059)
-- Name: study_area study_area_geom_quality_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area
    ADD CONSTRAINT study_area_geom_quality_item_code_fkey FOREIGN KEY (geom_quality_item_code) REFERENCES public.geom_quality_item(geom_quality_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4451 (class 2606 OID 18064)
-- Name: study_location study_location_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location
    ADD CONSTRAINT study_location_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4452 (class 2606 OID 18069)
-- Name: study_location study_location_geom_quality_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location
    ADD CONSTRAINT study_location_geom_quality_item_code_fkey FOREIGN KEY (geom_quality_item_code) REFERENCES public.geom_quality_item(geom_quality_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4453 (class 2606 OID 18074)
-- Name: study_trace study_trace_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace
    ADD CONSTRAINT study_trace_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4454 (class 2606 OID 18079)
-- Name: study_trace study_trace_geom_quality_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace
    ADD CONSTRAINT study_trace_geom_quality_item_code_fkey FOREIGN KEY (geom_quality_item_code) REFERENCES public.geom_quality_item(geom_quality_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4493 (class 2606 OID 18084)
-- Name: type_nat_rel type_nat_rel_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.type_nat_rel
    ADD CONSTRAINT type_nat_rel_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4494 (class 2606 OID 18089)
-- Name: type_nat_rel type_nat_rel_nat_rel_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.type_nat_rel
    ADD CONSTRAINT type_nat_rel_nat_rel_item_code_fkey FOREIGN KEY (nat_rel_item_code) REFERENCES public.nat_rel_item(nat_rel_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4714 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2024-02-29 18:46:57 UTC

--
-- PostgreSQL database dump complete
--

