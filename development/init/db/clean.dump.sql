--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Debian 16.2-1.pgdg110+2)
-- Dumped by pg_dump version 16.1

-- Started on 2024-02-20 15:30:13 UTC

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
00000000-0000-0000-0000-000000000000	5439750d-388f-4e25-a9af-47bc1ddb0fef	{"action":"user_confirmation_requested","actor_id":"a16ab323-9fad-4e46-aaef-86e00ff41acf","actor_username":"matthias.baldi@lambda-it.ch","log_type":"user","traits":{"provider":"email"}}	2023-05-23 09:00:58.54585+00	
00000000-0000-0000-0000-000000000000	9fc77fdd-099d-4f5a-a453-9f91d2a3625e	{"action":"user_confirmation_requested","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"user","traits":{"provider":"email"}}	2023-05-24 09:35:11.847107+00	
00000000-0000-0000-0000-000000000000	2826e72a-f5f8-41bc-99db-fbaf72d052ce	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-22 14:55:07.251674+00	
00000000-0000-0000-0000-000000000000	af492617-8356-43a1-93d5-7b7d0c81f2fe	{"action":"user_repeated_signup","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"user","traits":{"provider":"email"}}	2023-05-24 09:42:01.163875+00	
00000000-0000-0000-0000-000000000000	95712b9f-f9d8-42f8-adc9-f6ffeab00ad1	{"action":"user_repeated_signup","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"user","traits":{"provider":"email"}}	2023-05-24 09:42:25.913895+00	
00000000-0000-0000-0000-000000000000	58d92e7f-bedb-41a2-b887-4869dcb1e189	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-27 08:43:10.402801+00	
00000000-0000-0000-0000-000000000000	c3bf4506-aa6c-4f6b-8d11-ff83235af15f	{"action":"user_confirmation_requested","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"user","traits":{"provider":"email"}}	2023-05-24 09:46:21.492792+00	
00000000-0000-0000-0000-000000000000	40971377-e1ec-43bd-b395-f04e0df60d53	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 09:47:44.579514+00	
00000000-0000-0000-0000-000000000000	cb5a5cc7-6b02-4c0f-ac73-c63a7478318e	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 09:47:56.788042+00	
00000000-0000-0000-0000-000000000000	63d99b32-6f1e-4e67-90c5-30c66c51e814	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 11:15:40.080449+00	
00000000-0000-0000-0000-000000000000	ee5f039f-01f5-49a5-bfcd-d9c5c7fb42a9	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 11:21:03.964273+00	
00000000-0000-0000-0000-000000000000	1f52d623-fd5d-4bb9-b832-cacb43b96ee0	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 12:33:55.9521+00	
00000000-0000-0000-0000-000000000000	57d4826c-21d2-4e33-be75-b74799304190	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 13:34:11.369759+00	
00000000-0000-0000-0000-000000000000	4f6a9c61-34d6-4b27-9049-35196c3b9d95	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-24 13:56:38.989811+00	
00000000-0000-0000-0000-000000000000	fb70f80f-40ea-4df2-a534-cd164a94c916	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-06-27 08:45:31.242533+00	
00000000-0000-0000-0000-000000000000	81e7c0c7-44d4-4640-930f-20dea5503864	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-06-27 08:45:54.550247+00	
00000000-0000-0000-0000-000000000000	018b87d5-4de0-418b-8aab-92cce8ee8836	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-27 08:46:59.706108+00	
00000000-0000-0000-0000-000000000000	65eb3208-042a-4ee2-bbc1-341bd3172b1d	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-25 12:34:12.635072+00	
00000000-0000-0000-0000-000000000000	9b5ad469-a52a-4d89-adbf-828563a26a78	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-25 14:40:28.047826+00	
00000000-0000-0000-0000-000000000000	c0f3165f-8d6d-4938-994e-36d0f3b187de	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-06-27 08:49:00.311519+00	
00000000-0000-0000-0000-000000000000	4482c5b7-8f5f-425d-ae0a-8907003a6a3e	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-30 13:12:48.733373+00	
00000000-0000-0000-0000-000000000000	7c00843e-2df9-4977-9222-18ef4bfa67f8	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-28 07:20:30.272661+00	
00000000-0000-0000-0000-000000000000	2bef9eeb-9bf5-41dc-bdbd-1207fdbe1e99	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-31 09:06:49.605766+00	
00000000-0000-0000-0000-000000000000	80ed77ea-0bb1-49c0-bbad-fb9767bef509	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-28 09:41:25.169371+00	
00000000-0000-0000-0000-000000000000	3c9a1027-feed-438b-bdb2-97bbd680753d	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@secanis.ch","user_id":"e402d71a-4a1e-40d5-b9b4-80f18a32a6a2"}}	2023-05-31 09:09:22.456805+00	
00000000-0000-0000-0000-000000000000	e6bc60ff-43ba-4485-99ce-9f253120c0bd	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@secanis.ch","user_id":"e402d71a-4a1e-40d5-b9b4-80f18a32a6a2","user_phone":""}}	2023-05-31 09:18:55.308686+00	
00000000-0000-0000-0000-000000000000	253b6ecf-1f22-46ab-90df-30baed639a4e	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-28 10:44:34.445107+00	
00000000-0000-0000-0000-000000000000	582e4f6f-6c7b-41ed-a37c-e090a4f2a531	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@secanis.ch","user_id":"9f19560d-457c-43fb-abc7-542f2aa553dd"}}	2023-05-31 09:22:17.272752+00	
00000000-0000-0000-0000-000000000000	481a10e9-e7b3-477d-b2c1-a2798d4c7fed	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-28 12:45:22.250671+00	
00000000-0000-0000-0000-000000000000	28fb59de-bd33-435c-b8d2-f258ce804f94	{"action":"user_recovery_requested","actor_id":"9f19560d-457c-43fb-abc7-542f2aa553dd","actor_username":"matthias.baldi@secanis.ch","log_type":"user"}	2023-05-31 09:24:00.686472+00	
00000000-0000-0000-0000-000000000000	fdd01cc7-bf2f-4fb2-939f-09cad624a556	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-06-28 12:45:46.027066+00	
00000000-0000-0000-0000-000000000000	be736494-d0ed-427c-9e8a-a7b2d665b70c	{"action":"user_recovery_requested","actor_id":"9f19560d-457c-43fb-abc7-542f2aa553dd","actor_username":"matthias.baldi@secanis.ch","log_type":"user"}	2023-05-31 09:25:17.637942+00	
00000000-0000-0000-0000-000000000000	eba8c3f7-196b-4b17-93e6-8534502897d1	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-05-31 11:24:11.458282+00	
00000000-0000-0000-0000-000000000000	4080f321-5b57-4103-a5e4-45a3f364d353	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@secanis.ch","user_id":"9f19560d-457c-43fb-abc7-542f2aa553dd","user_phone":""}}	2023-05-31 11:24:20.043516+00	
00000000-0000-0000-0000-000000000000	6bafd9cf-835d-4989-9cd0-a0778cdbc3cf	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@secanis.ch","user_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc"}}	2023-05-31 11:24:29.312517+00	
00000000-0000-0000-0000-000000000000	a2b1ca2e-4f25-4e9f-b388-94da8de055db	{"action":"user_signedup","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"team"}	2023-05-31 11:24:45.497625+00	
00000000-0000-0000-0000-000000000000	64a4c857-b5d4-4949-b2f1-a2ef314d8842	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-03 06:29:28.318626+00	
00000000-0000-0000-0000-000000000000	117bab3d-df28-4bd7-820b-02d01f9ed8c3	{"action":"user_recovery_requested","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"user"}	2023-05-31 11:26:49.221859+00	
00000000-0000-0000-0000-000000000000	f3fae245-f8aa-4c53-8503-b7c78083d5f0	{"action":"login","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"account"}	2023-05-31 11:27:02.631482+00	
00000000-0000-0000-0000-000000000000	feaf9506-eae0-4059-9053-ae00ed9d0f00	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-03 09:29:13.140252+00	
00000000-0000-0000-0000-000000000000	f1f5d143-8e43-4e8d-b64d-95dd0d5f0e88	{"action":"user_recovery_requested","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"user"}	2023-05-31 11:28:32.433566+00	
00000000-0000-0000-0000-000000000000	7c85686a-05b6-410c-b298-520449af9722	{"action":"login","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"account"}	2023-05-31 11:28:53.003437+00	
00000000-0000-0000-0000-000000000000	d78deec2-6ba3-4b0c-ba02-159524b52be6	{"action":"user_recovery_requested","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"user"}	2023-05-31 11:34:48.849821+00	
00000000-0000-0000-0000-000000000000	85273481-c50f-494d-9dd8-5d3cb0d9554c	{"action":"login","actor_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","actor_username":"matthias.baldi@secanis.ch","log_type":"account"}	2023-05-31 11:35:05.828373+00	
00000000-0000-0000-0000-000000000000	4a7dccaa-3942-4b6c-a047-e706cd46aea2	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-06 15:10:19.571184+00	
00000000-0000-0000-0000-000000000000	7d339dc0-dc88-4390-81cb-a59bf14e3b4e	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 09:55:09.561887+00	
00000000-0000-0000-0000-000000000000	5dc72070-6929-4177-8c57-8383f0e2e5af	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@outlook.com","user_id":"3725afc0-fdf7-41ba-b247-cdbf9f411ef8"}}	2023-07-05 09:55:23.130415+00	
00000000-0000-0000-0000-000000000000	dfe580e9-ae4a-4576-ac74-2ec25ee68861	{"action":"user_signedup","actor_id":"3725afc0-fdf7-41ba-b247-cdbf9f411ef8","actor_username":"matthias.baldi@outlook.com","log_type":"team"}	2023-07-05 09:55:49.025224+00	
00000000-0000-0000-0000-000000000000	555f901d-cf2f-4c10-bd07-c2ffe0b6a3a6	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-07-05 09:56:32.395848+00	
00000000-0000-0000-0000-000000000000	356ec758-7222-4fb5-aa6b-3c193a0743d7	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nils.oesterling@swisstopo.ch","user_id":"d65f781f-aa00-4344-9d11-8d7dbd93cc2a"}}	2023-06-06 15:11:47.318956+00	
00000000-0000-0000-0000-000000000000	6fe5d3be-fb68-4802-9e51-0722c9c7d42e	{"action":"user_signedup","actor_id":"d65f781f-aa00-4344-9d11-8d7dbd93cc2a","actor_username":"nils.oesterling@swisstopo.ch","log_type":"team"}	2023-06-06 15:12:12.026084+00	
00000000-0000-0000-0000-000000000000	2cf399f9-849a-43d4-b06c-a0d216c9a5ce	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-06-06 15:13:02.158574+00	
00000000-0000-0000-0000-000000000000	6f26a7dd-196d-41c4-ae1c-5166ed6b65ba	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-12 12:05:20.1569+00	
00000000-0000-0000-0000-000000000000	58006401-8082-4b1d-9d97-b37772250102	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@secanis.ch","user_id":"3f6376cd-56a3-4938-aabf-5d81f320b0cc","user_phone":""}}	2023-06-12 12:05:29.434695+00	
00000000-0000-0000-0000-000000000000	170ab69c-8cdb-4ade-a38e-4d22783d5956	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"14d488a1-2da6-4c77-a6c4-e2e6f391e29d"}}	2023-07-03 09:30:58.820007+00	
00000000-0000-0000-0000-000000000000	32b5719c-3fb5-47e4-a461-b9892de57c65	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"14d488a1-2da6-4c77-a6c4-e2e6f391e29d","user_phone":""}}	2023-07-03 09:33:51.589671+00	
00000000-0000-0000-0000-000000000000	1db1413b-d006-4c43-ba10-9b01014bf7fc	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"1e5a1367-c33e-477f-a4dd-82fc8c4583fd"}}	2023-07-03 09:36:14.521974+00	
00000000-0000-0000-0000-000000000000	94cff79e-6fb5-48fb-8a1c-186f2f366db5	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"1e5a1367-c33e-477f-a4dd-82fc8c4583fd","user_phone":""}}	2023-07-03 09:43:31.421056+00	
00000000-0000-0000-0000-000000000000	1b149c67-4c28-44f5-b58c-838bfddc37d9	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"bc5b6be2-8d62-4634-9ae3-3413c2e63841"}}	2023-07-03 09:43:41.674305+00	
00000000-0000-0000-0000-000000000000	43eed27e-e8a2-4eeb-a00e-420f2f2f62e9	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"bc5b6be2-8d62-4634-9ae3-3413c2e63841","user_phone":""}}	2023-07-03 09:45:05.244913+00	
00000000-0000-0000-0000-000000000000	24203fc8-47cb-454b-b77b-e2232965397a	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"0654fb93-a10d-487f-960d-86889830fd53"}}	2023-07-03 09:45:14.618778+00	
00000000-0000-0000-0000-000000000000	9bbb6882-5fc4-4e7b-85ba-fe08bec23f21	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nils.oesterling@swisstopo.ch","user_id":"d65f781f-aa00-4344-9d11-8d7dbd93cc2a","user_phone":""}}	2023-07-03 09:45:35.115213+00	
00000000-0000-0000-0000-000000000000	6701fdd4-0d49-4bf2-b355-b4fc768f85f0	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nils.oesterling@swisstopo.ch","user_id":"dd81a893-3943-4c40-bc72-64ada30d6313"}}	2023-07-03 09:45:42.858751+00	
00000000-0000-0000-0000-000000000000	f3152cbf-a254-4962-95de-75b26a765ef0	{"action":"user_signedup","actor_id":"dd81a893-3943-4c40-bc72-64ada30d6313","actor_username":"nils.oesterling@swisstopo.ch","log_type":"team"}	2023-07-03 09:45:49.775682+00	
00000000-0000-0000-0000-000000000000	7b21fa58-e948-4e84-b7ef-35313e4ea517	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-14 12:02:46.379158+00	
00000000-0000-0000-0000-000000000000	1f101dc2-670b-4927-a87f-19e3796778c7	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-04 11:59:34.539767+00	
00000000-0000-0000-0000-000000000000	fa12c9f5-d44b-4b43-9694-dc861efe92c6	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"0654fb93-a10d-487f-960d-86889830fd53","user_phone":""}}	2023-07-04 11:59:41.635681+00	
00000000-0000-0000-0000-000000000000	8473bee8-cf42-4a21-a617-a5fad10c7a96	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"41602c8c-1891-4ad9-8caf-a5ff5e14e44c"}}	2023-07-04 12:00:55.254383+00	
00000000-0000-0000-0000-000000000000	1c456c10-b99b-40e3-822c-1e06f0b5a2e3	{"action":"user_signedup","actor_id":"41602c8c-1891-4ad9-8caf-a5ff5e14e44c","actor_username":"wayne@waynemaurer.net","log_type":"team"}	2023-07-04 12:01:10.536582+00	
00000000-0000-0000-0000-000000000000	619d6112-b469-4205-a2eb-345c93af29fb	{"action":"logout","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account"}	2023-07-04 12:29:19.299306+00	
00000000-0000-0000-0000-000000000000	b9593be4-c9cf-46bf-88c3-a53ed065d7c5	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-04 12:29:26.140229+00	
00000000-0000-0000-0000-000000000000	c0aa2f9d-64db-4ec5-a872-4f75cf325d83	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"41602c8c-1891-4ad9-8caf-a5ff5e14e44c","user_phone":""}}	2023-07-04 12:29:35.048529+00	
00000000-0000-0000-0000-000000000000	3218384e-4c69-47df-b983-e8a3884e098b	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"5057f449-99b3-4f05-bf8b-b5ea4400d8bb"}}	2023-07-04 12:30:06.361051+00	
00000000-0000-0000-0000-000000000000	b06204cc-24d1-4c62-8eb2-4aaa9c6789e9	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"5057f449-99b3-4f05-bf8b-b5ea4400d8bb","user_phone":""}}	2023-07-04 13:05:59.033055+00	
00000000-0000-0000-0000-000000000000	25bcb875-381e-4a14-9711-73ba37b94a50	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"35e699a6-d7de-4041-9f55-cd1f3c55e4a4"}}	2023-07-04 13:06:13.626493+00	
00000000-0000-0000-0000-000000000000	21a73623-05ce-40f2-bd27-5dfe1d3d0bb6	{"action":"user_signedup","actor_id":"35e699a6-d7de-4041-9f55-cd1f3c55e4a4","actor_username":"wayne@waynemaurer.net","log_type":"team"}	2023-07-04 14:06:14.635292+00	
00000000-0000-0000-0000-000000000000	d394065f-5874-4d5e-bad6-bed0b30b3be7	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 06:28:06.542452+00	
00000000-0000-0000-0000-000000000000	4a1e0a3a-044d-4928-afb3-3378b847433a	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"35e699a6-d7de-4041-9f55-cd1f3c55e4a4","user_phone":""}}	2023-07-05 06:28:14.143423+00	
00000000-0000-0000-0000-000000000000	7fd08fa3-2ca3-4957-93ec-5d22f54ebe19	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-15 06:56:31.146776+00	
00000000-0000-0000-0000-000000000000	b78b4c36-8e81-425a-bfc1-696797155cbd	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"55b00a8c-87de-4cb9-a1db-82a8d510b755"}}	2023-07-05 06:28:28.321702+00	
00000000-0000-0000-0000-000000000000	4b62bd19-a556-4043-9896-a204a4b3087b	{"action":"logout","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account"}	2023-07-05 06:28:34.562815+00	
00000000-0000-0000-0000-000000000000	104ce07b-b4cb-4cd3-b982-c1de69bf02b9	{"action":"user_signedup","actor_id":"55b00a8c-87de-4cb9-a1db-82a8d510b755","actor_username":"wayne@waynemaurer.net","log_type":"team"}	2023-07-05 06:29:01.686419+00	
00000000-0000-0000-0000-000000000000	53d126fb-b54f-454e-97f5-42586db50afa	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 07:49:12.361664+00	
00000000-0000-0000-0000-000000000000	c88afd45-8489-4681-8eb6-5fb68a9d97dc	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"55b00a8c-87de-4cb9-a1db-82a8d510b755","user_phone":""}}	2023-07-05 07:49:23.161907+00	
00000000-0000-0000-0000-000000000000	5b0a7cd2-8b2d-4716-953f-626e35f59b0c	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"aef71ffd-93d5-4e24-bd88-94cd786ff20c"}}	2023-07-05 07:49:34.114195+00	
00000000-0000-0000-0000-000000000000	76caa23f-9982-4415-87f6-34d6f42b0349	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-06-22 09:57:37.531958+00	
00000000-0000-0000-0000-000000000000	55899353-8184-4c53-9850-e573121b8ed5	{"action":"logout","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account"}	2023-07-05 07:50:54.862986+00	
00000000-0000-0000-0000-000000000000	d2948f2a-2940-4837-9a2d-6b2a32c6890b	{"action":"user_signedup","actor_id":"aef71ffd-93d5-4e24-bd88-94cd786ff20c","actor_username":"wayne@waynemaurer.net","log_type":"team"}	2023-07-05 07:50:58.14497+00	
00000000-0000-0000-0000-000000000000	9dadeb73-d8b0-4921-a071-f8ec623b80cc	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 09:16:25.20612+00	
00000000-0000-0000-0000-000000000000	d6b2ce50-d1d9-4f2c-8d21-e67779be86ae	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"aef71ffd-93d5-4e24-bd88-94cd786ff20c","user_phone":""}}	2023-07-05 09:16:33.616881+00	
00000000-0000-0000-0000-000000000000	d44fe934-84ba-41ee-9f34-c59d9a080ddb	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"d3efd193-2193-44ce-bd7e-65aadc90770f"}}	2023-07-05 09:16:59.478752+00	
00000000-0000-0000-0000-000000000000	73c4144d-4ce1-4862-8c71-3088975b1502	{"action":"user_signedup","actor_id":"d3efd193-2193-44ce-bd7e-65aadc90770f","actor_username":"wayne@waynemaurer.net","log_type":"team"}	2023-07-05 09:17:49.698098+00	
00000000-0000-0000-0000-000000000000	ce1cc08b-da3b-40b8-b70f-25f1ea026743	{"action":"logout","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account"}	2023-07-05 09:18:41.997113+00	
00000000-0000-0000-0000-000000000000	e11212de-f0be-48b3-8946-7e3f9a7dd16e	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 09:58:10.378779+00	
00000000-0000-0000-0000-000000000000	c5d22ca1-0a7e-4cbc-aef5-3212e920498a	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@outlook.com","user_id":"3725afc0-fdf7-41ba-b247-cdbf9f411ef8","user_phone":""}}	2023-07-05 09:58:17.336478+00	
00000000-0000-0000-0000-000000000000	49d250f8-0f0c-4f5b-b0d3-c0feedd55580	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@outlook.com","user_id":"a148f2f4-f5ea-46f2-876e-750163b3d9f8"}}	2023-07-05 09:58:25.161551+00	
00000000-0000-0000-0000-000000000000	0fba8b4e-bd04-46ed-a720-5be8f685f28b	{"action":"user_signedup","actor_id":"a148f2f4-f5ea-46f2-876e-750163b3d9f8","actor_username":"matthias.baldi@outlook.com","log_type":"team"}	2023-07-05 09:58:32.082902+00	
00000000-0000-0000-0000-000000000000	819c9ea5-a350-4581-a7c0-425d62361d6c	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@outlook.com","user_id":"a148f2f4-f5ea-46f2-876e-750163b3d9f8","user_phone":""}}	2023-07-05 09:59:24.862573+00	
00000000-0000-0000-0000-000000000000	e17cd876-7282-42e6-8cc6-a7d013aa238e	{"action":"logout","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account"}	2023-07-05 10:01:03.295941+00	
00000000-0000-0000-0000-000000000000	6db9448a-e11d-48dd-82a2-bcafc47c9d99	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 10:01:10.348135+00	
00000000-0000-0000-0000-000000000000	9a499048-6afe-4d07-801c-83ace8efba79	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@outlook.com","user_id":"5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a"}}	2023-07-05 10:01:21.345409+00	
00000000-0000-0000-0000-000000000000	7eced800-1fa7-47bb-93bd-245d16e520a4	{"action":"user_signedup","actor_id":"5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a","actor_username":"matthias.baldi@outlook.com","log_type":"team"}	2023-07-05 10:01:46.175352+00	
00000000-0000-0000-0000-000000000000	d2f001dc-4d66-40f8-a506-edbd5dbc55cc	{"action":"user_modified","actor_id":"5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a","actor_username":"matthias.baldi@outlook.com","log_type":"user"}	2023-07-05 10:01:55.665529+00	
00000000-0000-0000-0000-000000000000	cfe6f4b5-687c-4a3e-a1f9-159111544a01	{"action":"login","actor_id":"5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a","actor_username":"matthias.baldi@outlook.com","log_type":"account","traits":{"provider":"email"}}	2023-07-05 10:03:06.050754+00	
00000000-0000-0000-0000-000000000000	70a12d3e-0be2-4787-b2f6-4a600dea254f	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 10:05:45.322561+00	
00000000-0000-0000-0000-000000000000	24c941ff-39ff-470e-a756-fb7fe09dd3c8	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@outlook.com","user_id":"5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a","user_phone":""}}	2023-07-05 10:06:01.808167+00	
00000000-0000-0000-0000-000000000000	8459e4f2-e63a-46be-bded-7e145c60c407	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne@waynemaurer.net","user_id":"d3efd193-2193-44ce-bd7e-65aadc90770f","user_phone":""}}	2023-07-05 10:06:07.466337+00	
00000000-0000-0000-0000-000000000000	e244b7cb-34af-4c88-8b30-01b1d6e03e59	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nils.oesterling@swisstopo.ch","user_id":"dd81a893-3943-4c40-bc72-64ada30d6313","user_phone":""}}	2023-07-05 10:06:13.326279+00	
00000000-0000-0000-0000-000000000000	04a12a29-1835-4c8e-ae97-9e593677dae7	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nils.oesterling@swisstopo.ch","user_id":"356537c3-fb03-44f4-8e81-7871ad36760f"}}	2023-07-05 10:07:06.501862+00	
00000000-0000-0000-0000-000000000000	21b15766-9ffc-4efa-be1f-3575787591a9	{"action":"user_signedup","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"team"}	2023-07-05 14:31:05.914868+00	
00000000-0000-0000-0000-000000000000	c435eebc-a8a4-4914-8a9c-671bfcd15ede	{"action":"user_modified","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"user"}	2023-07-05 14:32:25.329489+00	
00000000-0000-0000-0000-000000000000	ec4e4467-06b3-4fb3-9826-734bcfce426e	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"swissgeol@swisstopo.ch","user_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc"}}	2023-07-05 14:33:22.875135+00	
00000000-0000-0000-0000-000000000000	752485cc-c4bb-4a66-96bf-f30df58ba444	{"action":"user_signedup","actor_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc","actor_username":"swissgeol@swisstopo.ch","log_type":"team"}	2023-07-05 14:33:34.545777+00	
00000000-0000-0000-0000-000000000000	9a5821b6-7cfa-49a9-886f-1a4ab2d5d007	{"action":"user_modified","actor_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc","actor_username":"swissgeol@swisstopo.ch","log_type":"user"}	2023-07-05 14:33:49.767766+00	
00000000-0000-0000-0000-000000000000	4782d9f8-4bc9-48b8-a583-ed891ae71e0c	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 14:36:43.014099+00	
00000000-0000-0000-0000-000000000000	50fdbca6-1602-4a31-a76c-a14617715ad7	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 14:37:20.511039+00	
00000000-0000-0000-0000-000000000000	c1db3751-3202-4461-acc0-cb2a782173e5	{"action":"logout","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account"}	2023-07-05 14:38:27.545453+00	
00000000-0000-0000-0000-000000000000	3bbedd3c-46e9-4827-b429-872d61d5bb3e	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 14:38:54.065051+00	
00000000-0000-0000-0000-000000000000	9a9fd2fc-d7bb-4d6c-aea1-b96c8301dfeb	{"action":"logout","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account"}	2023-07-05 14:39:56.437651+00	
00000000-0000-0000-0000-000000000000	d59168d2-8192-445c-a84c-d4bbfb01cd52	{"action":"login","actor_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc","actor_username":"swissgeol@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 14:40:18.784095+00	
00000000-0000-0000-0000-000000000000	9e2e9586-054f-46ad-865e-7567ac9bc41e	{"action":"logout","actor_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc","actor_username":"swissgeol@swisstopo.ch","log_type":"account"}	2023-07-05 14:40:44.159529+00	
00000000-0000-0000-0000-000000000000	7962b8bf-1032-45b3-a097-0cff239aa2e9	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-05 14:41:05.837659+00	
00000000-0000-0000-0000-000000000000	aa0a19e2-5cdd-49c5-9ae9-4f735029da27	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"michael.gysi@swisstopo.ch","user_id":"9568c612-a0b9-44c5-8836-513234d53409"}}	2023-07-05 14:42:39.978276+00	
00000000-0000-0000-0000-000000000000	8e6242c7-4394-4f0a-aa36-aa71f76b5793	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 06:12:54.874003+00	
00000000-0000-0000-0000-000000000000	b7134437-d887-4680-abb9-4b98130405b1	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 09:09:01.431178+00	
00000000-0000-0000-0000-000000000000	e319d15a-08eb-49e9-b5b1-2b201c6e9afc	{"action":"logout","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account"}	2023-07-06 09:34:28.269755+00	
00000000-0000-0000-0000-000000000000	aebac96b-e74d-489b-8035-9ee6d0ac3a42	{"action":"login","actor_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc","actor_username":"swissgeol@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 09:34:57.523212+00	
00000000-0000-0000-0000-000000000000	e90abcfc-7a8e-4ec9-8b78-9607baafd634	{"action":"logout","actor_id":"8c9071ba-26e0-47d1-91d3-809f4a141ddc","actor_username":"swissgeol@swisstopo.ch","log_type":"account"}	2023-07-06 10:06:26.871373+00	
00000000-0000-0000-0000-000000000000	e2442048-1d62-4116-8045-2f7249370e2c	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 10:06:40.112507+00	
00000000-0000-0000-0000-000000000000	3d862237-a11d-4b17-bdb3-ff302626de30	{"action":"user_signedup","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"team"}	2023-07-06 11:06:50.870104+00	
00000000-0000-0000-0000-000000000000	48aa40de-3b83-45e7-83c7-648b54241217	{"action":"user_modified","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"user"}	2023-07-06 11:07:16.932989+00	
00000000-0000-0000-0000-000000000000	a431a0b9-8d39-49a3-819d-43b51369ad94	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 11:13:07.085544+00	
00000000-0000-0000-0000-000000000000	a8e1cd52-3d32-4c8a-be5f-c4b9a5527ae5	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 11:14:54.82065+00	
00000000-0000-0000-0000-000000000000	cb8ae6ef-9189-4c12-990d-c9bcd6279ff8	{"action":"user_recovery_requested","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"user"}	2023-07-06 11:16:35.039103+00	
00000000-0000-0000-0000-000000000000	237ef5ad-f96b-429d-a054-34777a1efe42	{"action":"login","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"account"}	2023-07-06 11:16:43.894447+00	
00000000-0000-0000-0000-000000000000	c892b75c-9887-496b-9611-43ecf218b16d	{"action":"user_modified","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"user"}	2023-07-06 11:16:52.180317+00	
00000000-0000-0000-0000-000000000000	318c2610-2aad-4d30-8a0b-68b1f90133f7	{"action":"login","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 11:17:09.520268+00	
00000000-0000-0000-0000-000000000000	11dee052-f0ac-41a3-942f-6e46b62de2cb	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-06 12:53:17.026175+00	
00000000-0000-0000-0000-000000000000	aa257deb-3638-482f-9f2e-2aaa211eea8d	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"marcel.pfiffner@swisstopo.ch","user_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b"}}	2023-07-06 12:54:03.821663+00	
00000000-0000-0000-0000-000000000000	9fb9ac6e-70c6-4359-b6c3-678a1159418f	{"action":"logout","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account"}	2023-07-06 13:38:00.103366+00	
00000000-0000-0000-0000-000000000000	91ab68db-8ff1-41b5-9232-7cefaa6c95a0	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-07 08:30:05.903276+00	
00000000-0000-0000-0000-000000000000	461ac4df-af13-4b2c-a6f4-704044724da8	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-07 09:54:18.023309+00	
00000000-0000-0000-0000-000000000000	9047f285-4f90-40c9-87e7-f9d1a5c79b7b	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-08 19:21:31.478882+00	
00000000-0000-0000-0000-000000000000	a09b1877-fc6f-4515-8d13-775458928f1b	{"action":"user_recovery_requested","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"user"}	2023-07-10 06:51:21.994511+00	
00000000-0000-0000-0000-000000000000	ea5bbe1e-5c9e-4e34-9afc-8cf50b3c08d9	{"action":"user_signedup","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"team"}	2023-07-10 06:51:40.05791+00	
00000000-0000-0000-0000-000000000000	c30073b0-3c94-4d20-85d7-96a35173e8aa	{"action":"user_modified","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"user"}	2023-07-10 06:51:56.525793+00	
00000000-0000-0000-0000-000000000000	09f2fe4a-e30d-4cd6-9942-b28605ae2144	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-10 08:41:47.617275+00	
00000000-0000-0000-0000-000000000000	9b1b2ea7-1694-4f42-92e2-da9e7c26b528	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-11 12:36:03.918146+00	
00000000-0000-0000-0000-000000000000	775aaae2-9b6e-4050-9be8-9678d5678650	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-11 14:15:40.290407+00	
00000000-0000-0000-0000-000000000000	7ffabd42-6a5d-49b1-b41b-98e7422d4483	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-11 14:16:37.809596+00	
00000000-0000-0000-0000-000000000000	6372527f-845e-4428-a1cd-fff0dece8f73	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-11 14:16:54.710073+00	
00000000-0000-0000-0000-000000000000	22d21d5c-7482-43ee-b439-2e9a412e04ee	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-11 14:26:42.339141+00	
00000000-0000-0000-0000-000000000000	fa4f26a3-8c2a-41da-beac-19b23288c066	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-11 14:26:45.067156+00	
00000000-0000-0000-0000-000000000000	531f1c78-84bc-4383-b035-5783456cf739	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-12 08:24:58.599286+00	
00000000-0000-0000-0000-000000000000	40f97760-3bad-42ec-b29f-387f79bf16d4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-13 07:14:10.493575+00	
00000000-0000-0000-0000-000000000000	e62b8b4b-1cc5-4a1f-916e-87a1655516d1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 07:23:57.797623+00	
00000000-0000-0000-0000-000000000000	b363b8a4-e4f8-40cc-b111-2a668345958f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 09:01:24.036131+00	
00000000-0000-0000-0000-000000000000	0ffa5f00-919b-486f-b9fb-1d9a7678427f	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-17 09:48:54.675874+00	
00000000-0000-0000-0000-000000000000	ae11dbe8-edaf-40f5-adaf-46676f715bb0	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 09:55:42.299499+00	
00000000-0000-0000-0000-000000000000	19a45479-095a-44c0-8764-6200a4ef9b60	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 11:30:54.692928+00	
00000000-0000-0000-0000-000000000000	0c98a0f8-e28e-495f-8d33-d7d81e39053a	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"peter.hayoz@swisstopo.ch","user_id":"a5c53661-4d09-4805-9190-0a66a7407d31"}}	2023-07-17 11:31:31.004424+00	
00000000-0000-0000-0000-000000000000	f7b5b54c-0235-42ba-b30f-f512a19a11a7	{"action":"login","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 11:44:33.655606+00	
00000000-0000-0000-0000-000000000000	de076e32-8534-4ef7-8c36-5d2b13bee283	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:02:00.30476+00	
00000000-0000-0000-0000-000000000000	274fa0bf-af5c-46af-9b9b-a685d915d71a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-17 12:08:31.135009+00	
00000000-0000-0000-0000-000000000000	c29b74c3-b7a9-43bb-b5aa-ac156c030ec1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:08:54.938463+00	
00000000-0000-0000-0000-000000000000	f0873f99-f974-4666-8555-8986b999dd9d	{"action":"user_signedup","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"team"}	2023-07-17 12:12:16.437455+00	
00000000-0000-0000-0000-000000000000	8bbd825e-623d-4838-aa99-3b4f8a3b2df0	{"action":"user_modified","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"user"}	2023-07-17 12:14:25.869955+00	
00000000-0000-0000-0000-000000000000	39bbba67-54b3-4d33-9c6f-352d7a828d8e	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:14:43.4905+00	
00000000-0000-0000-0000-000000000000	8495cdc8-a83c-45e6-9297-0a0760681eea	{"action":"user_recovery_requested","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"user"}	2023-07-17 12:25:54.12248+00	
00000000-0000-0000-0000-000000000000	5722182f-1397-4739-be7b-92e7b9b15ccf	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account"}	2023-07-17 12:26:04.09757+00	
00000000-0000-0000-0000-000000000000	5b4dc8d4-e045-4148-a705-9718100efb8b	{"action":"user_modified","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"user"}	2023-07-17 12:26:27.462933+00	
00000000-0000-0000-0000-000000000000	9c011254-9fac-4e68-bc30-b860568fd955	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:26:51.290968+00	
00000000-0000-0000-0000-000000000000	fe50ac04-ab69-4e1f-b44b-a4bdbd88ac3a	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:26:54.002802+00	
00000000-0000-0000-0000-000000000000	8e089495-7031-46ca-ae3c-f32a671003a6	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:27:03.009598+00	
00000000-0000-0000-0000-000000000000	7b16e137-4d85-4b19-8cbb-9eab8f8365ab	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:27:16.021665+00	
00000000-0000-0000-0000-000000000000	bb2141a3-4617-4224-9de3-74f68fd99f4c	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:27:35.83456+00	
00000000-0000-0000-0000-000000000000	29baf0f0-6c45-4da6-84cb-0cd19202aa73	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:27:45.161252+00	
00000000-0000-0000-0000-000000000000	6c583df8-03b6-4bfd-a0b6-d968da1b9f3e	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 12:28:00.036157+00	
00000000-0000-0000-0000-000000000000	6556e4ca-ebd3-462f-b93c-e71d0de105b8	{"action":"logout","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account"}	2023-07-17 12:28:21.057646+00	
00000000-0000-0000-0000-000000000000	e7997b2b-fd6c-4099-b74b-2ce08e3b7e2e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 13:09:05.642909+00	
00000000-0000-0000-0000-000000000000	c19c8eb4-bc16-4658-9e24-bd3b520096b2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 14:55:56.098815+00	
00000000-0000-0000-0000-000000000000	4d6fe788-12d4-4f69-848c-22e95a0a898e	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-17 15:11:39.131286+00	
00000000-0000-0000-0000-000000000000	5c0d720a-db95-4588-abfd-75f5faaa29ff	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-17 15:41:49.567742+00	
00000000-0000-0000-0000-000000000000	a82b8f1f-8c96-47dd-ab5b-f7d94d5ad53d	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-18 07:38:06.2466+00	
00000000-0000-0000-0000-000000000000	5caa8ea4-fb85-4bb4-8e89-5feb6331da0c	{"action":"login","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-18 09:25:07.459296+00	
00000000-0000-0000-0000-000000000000	7c6729e6-5239-4e0e-86a7-35ff3cb9957b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-18 13:49:38.135055+00	
00000000-0000-0000-0000-000000000000	229fd1eb-f3bc-412d-b80d-88678bdf266e	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-18 14:22:50.534804+00	
00000000-0000-0000-0000-000000000000	b43d0c93-0c07-414a-bde3-df3f2083015a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-19 13:43:36.896146+00	
00000000-0000-0000-0000-000000000000	fa3f85d6-3e1f-472a-bd97-551e7399a764	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-19 14:05:10.056028+00	
00000000-0000-0000-0000-000000000000	105038a7-47b4-4143-95de-cc6f6fc0f6e7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-20 11:49:39.325538+00	
00000000-0000-0000-0000-000000000000	e93de9e5-e6c1-42b7-9252-51fdb3d96798	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-21 06:00:00.696894+00	
00000000-0000-0000-0000-000000000000	1fe3b4aa-9dec-4bba-b905-3fc8ecd56b80	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-21 10:08:56.893937+00	
00000000-0000-0000-0000-000000000000	1e7a7258-2cfd-46c6-8c42-0fe7c9fb635d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-21 12:45:48.263629+00	
00000000-0000-0000-0000-000000000000	fb62f9b2-6fc6-4ae9-867b-2692586c5bb9	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"daniel.gechter@swisstopo.ch","user_id":"afe4b578-1ae4-4bbf-a595-b2c2789a77b4"}}	2023-07-21 12:50:19.912168+00	
00000000-0000-0000-0000-000000000000	5528ab17-cc73-4148-a6b2-2866301969e4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-24 05:53:41.073073+00	
00000000-0000-0000-0000-000000000000	1f9f9a6f-806a-43d7-9b0d-dde2266d2263	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-24 13:58:30.220058+00	
00000000-0000-0000-0000-000000000000	f361d5c6-57cd-43cd-b931-794d5acc0f22	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"milan.beres@swisstopo.ch","user_id":"67a54714-64a4-4684-bf8e-0d524fa3256f"}}	2023-07-24 13:59:26.634286+00	
00000000-0000-0000-0000-000000000000	ccab6b7b-a1e9-47f5-81bb-11e8f590abf5	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-24 14:39:23.670438+00	
00000000-0000-0000-0000-000000000000	a449cc76-3e53-4927-99c1-cb1145b5ea36	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-25 08:39:54.559173+00	
00000000-0000-0000-0000-000000000000	c4aa45f2-2c8f-4fec-9f8d-357efc7a2183	{"action":"user_signedup","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"team"}	2023-07-25 09:08:10.419852+00	
00000000-0000-0000-0000-000000000000	f930f225-c6ba-4c04-b4e0-3d90c757e513	{"action":"user_modified","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"user"}	2023-07-25 09:09:00.302894+00	
00000000-0000-0000-0000-000000000000	036e52ee-1714-43eb-8344-c9c5a36592ea	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-25 10:14:53.818754+00	
00000000-0000-0000-0000-000000000000	b7693330-e304-47f8-b3c6-464e46120c5f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-25 11:14:56.95263+00	
00000000-0000-0000-0000-000000000000	787f7c68-608f-45f4-adae-42592e72cfe0	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-25 13:26:18.737339+00	
00000000-0000-0000-0000-000000000000	00a56229-4533-49d5-a9bd-ee9533b2ec92	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-25 14:35:00.154596+00	
00000000-0000-0000-0000-000000000000	25e948ce-24df-4f43-b7e4-d13602d4c97e	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-25 15:31:08.393042+00	
00000000-0000-0000-0000-000000000000	cb627906-52ae-45da-89a4-2b0f9cde20c0	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-26 06:03:57.425329+00	
00000000-0000-0000-0000-000000000000	7c3e7542-f48f-4ea8-8465-07ab29712643	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-26 10:04:28.978598+00	
00000000-0000-0000-0000-000000000000	17b40c5c-a945-4564-b69e-26b133290fbd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-26 11:28:24.991362+00	
00000000-0000-0000-0000-000000000000	b27e83cd-5522-4b7b-9f58-e2cf9a267834	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-26 13:44:10.808394+00	
00000000-0000-0000-0000-000000000000	663c9235-1366-418c-997b-32b0f2910072	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-26 15:17:36.242526+00	
00000000-0000-0000-0000-000000000000	5d17aa66-3b2e-415c-a6b8-d9db6b5471f0	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-26 15:17:51.355501+00	
00000000-0000-0000-0000-000000000000	e1fd7414-b51c-4af2-9903-eb87c9f53257	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-27 08:08:23.376002+00	
00000000-0000-0000-0000-000000000000	6eb560bb-73e3-4300-9ed3-dbbbe69047ea	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-27 09:15:14.856841+00	
00000000-0000-0000-0000-000000000000	83cb20e4-b35f-4630-a8d0-76c24005b152	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 06:01:29.482177+00	
00000000-0000-0000-0000-000000000000	d4fd46ec-3b0a-4373-a6e1-702fae08530d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 07:32:29.782836+00	
00000000-0000-0000-0000-000000000000	3743b12a-42b9-4500-ae59-29ccc2ad3f47	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 08:34:07.273963+00	
00000000-0000-0000-0000-000000000000	cefcc94e-1a67-4695-802b-be4177596541	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 10:19:48.51273+00	
00000000-0000-0000-0000-000000000000	97e1fcdf-1fd4-47e1-8d6d-899ed10dcc63	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 12:53:04.910472+00	
00000000-0000-0000-0000-000000000000	3e02da1c-fddb-4002-92b4-b7ccfb70f948	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 13:53:44.607868+00	
00000000-0000-0000-0000-000000000000	bfb0ed2d-26a0-4106-96df-788b55459c6c	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stijn.vermeeren@swisstopo.ch","user_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b"}}	2023-07-28 14:08:02.271603+00	
00000000-0000-0000-0000-000000000000	aaa73272-9106-4d5f-8319-dae0da4b3a33	{"action":"user_signedup","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"team"}	2023-07-28 14:10:05.870179+00	
00000000-0000-0000-0000-000000000000	89f697d4-df03-4188-ab28-3c89e5b03fa1	{"action":"user_modified","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"user"}	2023-07-28 14:10:49.697177+00	
00000000-0000-0000-0000-000000000000	74c379bb-ce38-43da-bf9d-502b9ede0e19	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-07-28 14:59:19.102325+00	
00000000-0000-0000-0000-000000000000	f040eece-6b20-474c-9738-b21ceeb59b61	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-07-28 15:28:44.935459+00	
00000000-0000-0000-0000-000000000000	22778f83-795b-4927-9c54-8afcf6281974	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 06:15:09.143392+00	
00000000-0000-0000-0000-000000000000	33ba1c1f-a89e-4018-b088-6cc4cd56f31d	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 07:01:08.90784+00	
00000000-0000-0000-0000-000000000000	4b32617b-e2e1-4dd4-a60c-7785c9abe52d	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-02 07:12:04.896356+00	
00000000-0000-0000-0000-000000000000	35a82419-6a22-4881-af21-1d624340f746	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 09:36:09.110259+00	
00000000-0000-0000-0000-000000000000	fdc57ee8-e997-4fba-88e8-c0bf4de721a6	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 13:03:55.011784+00	
00000000-0000-0000-0000-000000000000	493af8c4-aaac-499f-bf9a-dfec6bef2f8b	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 13:03:55.076763+00	
00000000-0000-0000-0000-000000000000	7e893469-37d9-4006-9788-513c1ddea938	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 14:15:54.005565+00	
00000000-0000-0000-0000-000000000000	6eb393bb-c4f3-42b7-95e5-1829c97c1fd9	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-02 15:29:35.639832+00	
00000000-0000-0000-0000-000000000000	70375be4-3726-4efe-abbb-0180e38f57c1	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-02 15:30:04.344366+00	
00000000-0000-0000-0000-000000000000	6681f314-1505-41ae-8548-1d259e47be6d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 05:46:38.3153+00	
00000000-0000-0000-0000-000000000000	9fd833b6-a922-4025-818f-76bc71a5d7a7	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 08:04:05.723203+00	
00000000-0000-0000-0000-000000000000	767bb183-5ef9-458d-87ba-cd6fc8edcda3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 08:19:44.813942+00	
00000000-0000-0000-0000-000000000000	6f49d6c1-d72e-428d-bad2-278ff35bfed9	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-03 08:21:06.489716+00	
00000000-0000-0000-0000-000000000000	e28fed0b-e095-4b3e-8a1f-7dccb839f2ce	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 08:21:22.672696+00	
00000000-0000-0000-0000-000000000000	b0635ec1-b394-412a-9012-75103f636bf5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 09:20:21.878083+00	
00000000-0000-0000-0000-000000000000	41b7f332-e6c4-4f9c-a150-bbdff94f18c8	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 09:29:30.891377+00	
00000000-0000-0000-0000-000000000000	188a4a41-7b4a-43a6-9892-d5fd2229ad5d	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-03 09:47:30.185415+00	
00000000-0000-0000-0000-000000000000	5895d4df-16e0-4e0e-a5cd-e56a13244ce4	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 11:32:50.636182+00	
00000000-0000-0000-0000-000000000000	0e89c61f-4b23-4cb2-9400-8f96217570a7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 11:55:32.627133+00	
00000000-0000-0000-0000-000000000000	d54d9816-fbdc-455e-b7f1-8fb5cd40aa6a	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-03 12:10:27.71505+00	
00000000-0000-0000-0000-000000000000	ecfbf16f-c34a-4b7a-a9e8-8f572195b0e5	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 12:12:46.373703+00	
00000000-0000-0000-0000-000000000000	1ac43c67-e394-4ba1-b6c2-d4cb7fe34d3e	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-03 12:20:14.66955+00	
00000000-0000-0000-0000-000000000000	818da024-0e98-4abc-bfb1-53ee8014238e	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 12:20:23.490659+00	
00000000-0000-0000-0000-000000000000	c08468f8-9360-4611-96cc-04b38c7cbb5b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 13:08:18.842075+00	
00000000-0000-0000-0000-000000000000	1f61c57c-1fa9-49d3-8b2f-3fb88f82f990	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-03 13:13:52.902439+00	
00000000-0000-0000-0000-000000000000	9f9ac42b-1d2d-4bc2-a1d2-1bf79993afdd	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 13:15:26.590358+00	
00000000-0000-0000-0000-000000000000	4f13f79f-76eb-4ad0-8d2b-48ba614f0a0f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 14:15:42.295692+00	
00000000-0000-0000-0000-000000000000	9388d70d-26b7-492e-afde-7a66b09ad19f	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-03 14:33:31.795319+00	
00000000-0000-0000-0000-000000000000	5e60717e-4e7f-4bb0-8c24-8ecac522b9a2	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-03 15:00:10.456699+00	
00000000-0000-0000-0000-000000000000	436138f4-e6aa-45c6-a189-6ebe107a911b	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-04 08:10:18.556841+00	
00000000-0000-0000-0000-000000000000	61c20b2a-744a-463f-87f1-6497dc5a3636	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-04 09:13:15.229408+00	
00000000-0000-0000-0000-000000000000	ee0787f2-9356-4804-a001-96575938f9d2	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-04 10:00:51.736509+00	
00000000-0000-0000-0000-000000000000	5fc15e24-c67a-4cdf-a997-e374422eabec	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-04 10:20:08.134231+00	
00000000-0000-0000-0000-000000000000	d5a16e58-54a5-4c74-a8c5-f5aeab91efde	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-04 13:22:09.052158+00	
00000000-0000-0000-0000-000000000000	4c4a7cc2-b250-4bf7-9f69-68c17bd79581	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-04 14:22:48.190817+00	
00000000-0000-0000-0000-000000000000	b36578d3-2b2d-4589-acf7-f349b9b7d060	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 06:16:58.155357+00	
00000000-0000-0000-0000-000000000000	f2cbd666-16f8-42ef-90ab-d6a8a75f24c6	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 06:53:40.479284+00	
00000000-0000-0000-0000-000000000000	134aa906-cbda-4cb0-b5e1-aa5bc6456db5	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 07:18:22.282225+00	
00000000-0000-0000-0000-000000000000	963716ed-d654-48b2-bfa1-8be00d5d8701	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 07:23:35.838021+00	
00000000-0000-0000-0000-000000000000	93b8ebf0-d622-4d20-949f-a2cc97d56bde	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 09:18:35.758911+00	
00000000-0000-0000-0000-000000000000	1b5baa79-7d41-4ccc-bd8d-8298b238139a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-07 09:22:48.677695+00	
00000000-0000-0000-0000-000000000000	60d2328f-ce1d-433d-9123-773f1732a1d8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 09:23:02.666969+00	
00000000-0000-0000-0000-000000000000	09d320fe-6a1c-4604-bfa8-11b0dad72c33	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 13:38:15.160343+00	
00000000-0000-0000-0000-000000000000	ba7c2c1d-3134-4d67-9258-c9c4b4318ef5	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"pfifi@bluewin.ch","user_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba"}}	2023-08-07 13:40:07.330039+00	
00000000-0000-0000-0000-000000000000	8796f5d1-951f-42c8-90df-43f303914443	{"action":"user_signedup","actor_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba","actor_username":"pfifi@bluewin.ch","log_type":"team"}	2023-08-07 13:40:40.545388+00	
00000000-0000-0000-0000-000000000000	6ad690a4-90ca-4146-b7a8-3ba147b5335a	{"action":"user_modified","actor_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba","actor_username":"pfifi@bluewin.ch","log_type":"user"}	2023-08-07 13:41:07.805025+00	
00000000-0000-0000-0000-000000000000	a445e41a-b0c2-40c2-af7f-21f27fd1dd47	{"action":"user_modified","actor_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba","actor_username":"pfifi@bluewin.ch","log_type":"user"}	2023-08-07 13:41:55.097519+00	
00000000-0000-0000-0000-000000000000	80153d6e-a08f-4836-aa5a-af7b00cb0926	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-07 13:42:50.622052+00	
00000000-0000-0000-0000-000000000000	d6a64583-5a7f-4987-8e45-a0399202df19	{"action":"login","actor_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba","actor_username":"pfifi@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 13:43:34.700891+00	
00000000-0000-0000-0000-000000000000	13507ed1-d407-4379-be0a-8124cbb85702	{"action":"logout","actor_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba","actor_username":"pfifi@bluewin.ch","log_type":"account"}	2023-08-07 13:49:01.204537+00	
00000000-0000-0000-0000-000000000000	d1b2f781-1bcb-4c98-b4ac-e1c049e34d1f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-07 13:49:09.827227+00	
00000000-0000-0000-0000-000000000000	a952f007-f97a-4b69-848c-7f249ed00b45	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-08 09:56:17.235521+00	
00000000-0000-0000-0000-000000000000	68fbf795-6e2e-4a74-91f2-2bf0a97d5bb4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-08 13:06:27.299389+00	
00000000-0000-0000-0000-000000000000	032248cf-2b5c-4261-b9c6-bbe2e831d436	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-08 15:09:05.934207+00	
00000000-0000-0000-0000-000000000000	abd3ce77-43f7-4df1-a89e-376bc6c41e34	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-08 15:51:01.492755+00	
00000000-0000-0000-0000-000000000000	5934b4b0-5679-4424-89cc-d9636249836a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-09 06:39:55.347414+00	
00000000-0000-0000-0000-000000000000	e3d14368-0c08-4ed5-a90c-37880bc738a3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-09 08:54:52.992309+00	
00000000-0000-0000-0000-000000000000	ee2cb375-0dc1-4815-9fb6-67a76411bf75	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-09 11:49:15.338995+00	
00000000-0000-0000-0000-000000000000	5a2e1128-0065-47cc-8d5a-f7ba89ef5a6b	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-09 13:07:57.572889+00	
00000000-0000-0000-0000-000000000000	80ed7ff7-2781-46c2-a88b-77d4862e041e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-09 14:36:25.250437+00	
00000000-0000-0000-0000-000000000000	fcc1a773-e096-47b1-bb2d-b9c86ab07f83	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-09 15:13:42.17327+00	
00000000-0000-0000-0000-000000000000	2af845ec-0838-4b9c-b1f0-9c6087fda22d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-10 06:18:22.673915+00	
00000000-0000-0000-0000-000000000000	9118d6f3-8351-4ecf-aaa7-77de085dfd91	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-10 07:23:31.562334+00	
00000000-0000-0000-0000-000000000000	f0af8459-03b4-486b-9033-29b85eea0c15	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-10 08:27:18.369465+00	
00000000-0000-0000-0000-000000000000	96ffbec7-2853-42ea-8bcc-593e88a4beb5	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"janine@fankhauser.cc","user_id":"5c2fa081-a226-4ed1-ab79-0945295b6026"}}	2023-08-10 09:14:51.843664+00	
00000000-0000-0000-0000-000000000000	755565a6-4520-4d40-aa8e-41f51112ee4b	{"action":"user_signedup","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"team"}	2023-08-10 09:15:33.452788+00	
00000000-0000-0000-0000-000000000000	4fa9755a-4b8f-4f46-9266-8a67504739fa	{"action":"user_modified","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"user"}	2023-08-10 09:19:57.847984+00	
00000000-0000-0000-0000-000000000000	2a75b507-6717-4b2c-ab56-b4b2f3c864ce	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-10 09:20:27.963666+00	
00000000-0000-0000-0000-000000000000	76a91140-e163-413a-849b-a3b2f40c321a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-10 12:51:15.668458+00	
00000000-0000-0000-0000-000000000000	3203df5b-ec7f-470e-a9dc-be26300d6c7b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-10 13:54:52.567541+00	
00000000-0000-0000-0000-000000000000	6c6d5e05-6708-4f24-b302-a9c8a7c81049	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-10 14:55:05.895281+00	
00000000-0000-0000-0000-000000000000	d06d9683-80ae-4832-ae9b-fd498b7533e7	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-10 15:11:55.2661+00	
00000000-0000-0000-0000-000000000000	3016052b-c9a0-4cf2-a6b3-227cf0b9f00f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-11 09:50:45.871326+00	
00000000-0000-0000-0000-000000000000	28e652d7-1aea-4308-9a65-3545d75b1627	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-11 10:52:31.915256+00	
00000000-0000-0000-0000-000000000000	8e4a6763-e407-475a-931f-4d97741af2a2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-11 11:53:38.455201+00	
00000000-0000-0000-0000-000000000000	4b8c0d86-4d50-457c-a76b-9ca24aa602ca	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-11 13:01:44.001669+00	
00000000-0000-0000-0000-000000000000	8232bc3d-7fdf-4215-99a9-d721b2803f51	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-11 13:23:25.554017+00	
00000000-0000-0000-0000-000000000000	ff2d2967-1145-4e3c-a918-e677e7899065	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 06:13:10.946995+00	
00000000-0000-0000-0000-000000000000	c25da138-b666-4a50-8a79-125a438189ca	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-14 07:25:03.378464+00	
00000000-0000-0000-0000-000000000000	6f286b16-79ea-4142-aa74-8b7c0bebb546	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 08:21:35.312833+00	
00000000-0000-0000-0000-000000000000	afd96d26-f827-42a4-808a-c4589eb625b3	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-14 08:28:46.307341+00	
00000000-0000-0000-0000-000000000000	ef0cff82-133f-4645-8ced-3246a0e74314	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 09:57:10.28545+00	
00000000-0000-0000-0000-000000000000	51680d23-c845-43c6-abba-2d1760e5abda	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 11:12:55.606624+00	
00000000-0000-0000-0000-000000000000	2376bd27-7bb8-4428-ae1e-78b25949cff6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-14 11:43:33.028133+00	
00000000-0000-0000-0000-000000000000	1447f6c8-92dd-4247-95ed-4975374c0d8e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-14 12:47:47.188152+00	
00000000-0000-0000-0000-000000000000	b962d021-7fa8-460c-9bd2-d232bcb4069c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 13:24:04.904021+00	
00000000-0000-0000-0000-000000000000	84de6401-b388-4542-ba78-0016398e3fd8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 14:26:16.359114+00	
00000000-0000-0000-0000-000000000000	aeed2949-022e-42cf-b4a0-00467e3f37aa	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-14 15:28:12.338961+00	
00000000-0000-0000-0000-000000000000	a9c01a8d-8efa-40dd-bd0b-88878fa2ecbc	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-14 15:31:50.385665+00	
00000000-0000-0000-0000-000000000000	1937b323-b845-4bd6-8caf-1d0d5d012a64	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-15 07:32:26.581743+00	
00000000-0000-0000-0000-000000000000	43ffd55a-3b24-4da5-a3b5-ee986849d304	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-15 07:39:09.111381+00	
00000000-0000-0000-0000-000000000000	3cf2ff2d-3a03-4404-9e5a-46831e9e0600	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-15 11:07:40.974639+00	
00000000-0000-0000-0000-000000000000	18a459ad-aa51-408a-a2f3-386b2f0a0c5a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-15 11:37:59.478378+00	
00000000-0000-0000-0000-000000000000	33ecbd62-3d4c-40e3-b43d-ecd0f710404b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-15 12:13:02.439781+00	
00000000-0000-0000-0000-000000000000	e09e843c-9b13-41ed-8f70-0a132201d01e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-15 13:12:58.281154+00	
00000000-0000-0000-0000-000000000000	53b70a5b-c7d5-415b-8acd-f122e619f48c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-15 14:44:07.533153+00	
00000000-0000-0000-0000-000000000000	1181b9bc-3bb4-432b-bc39-0ce482ebef27	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-15 15:16:30.292792+00	
00000000-0000-0000-0000-000000000000	dc56cd63-1e16-40ff-98dd-b27cc0a03b33	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-16 05:57:32.551246+00	
00000000-0000-0000-0000-000000000000	e9f2c3f6-e8a9-4c25-b31d-c440a03254f6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-17 06:21:58.152513+00	
00000000-0000-0000-0000-000000000000	f5ec6282-98d5-4dcb-853a-81fd03695e05	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-17 09:38:34.911536+00	
00000000-0000-0000-0000-000000000000	34979643-c0ad-47ec-b340-fb2eb206bf05	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-17 15:14:20.267154+00	
00000000-0000-0000-0000-000000000000	7179ced1-5fa0-43a1-9470-e20b993925c7	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-17 15:14:30.060906+00	
00000000-0000-0000-0000-000000000000	beceb30d-f047-4c18-8b2a-4ea467427a50	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-18 08:32:29.818745+00	
00000000-0000-0000-0000-000000000000	8e24b7fa-cfad-4923-99a2-46f92d26ad12	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-18 09:34:09.209343+00	
00000000-0000-0000-0000-000000000000	7a4515e0-bfda-4d56-b6d6-b1edda5f3412	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-18 12:42:56.723347+00	
00000000-0000-0000-0000-000000000000	db26d5c3-155d-45dd-8f12-d29e523db430	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"l.sergi@live.com","user_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc"}}	2023-08-18 13:38:00.829882+00	
00000000-0000-0000-0000-000000000000	d360ceb1-b03d-4812-a3f2-8cdea7d0fe54	{"action":"user_signedup","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"team"}	2023-08-18 13:39:31.05725+00	
00000000-0000-0000-0000-000000000000	52d26f67-6f47-40ff-8efe-888fa85615bd	{"action":"user_modified","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"user"}	2023-08-18 13:39:36.766802+00	
00000000-0000-0000-0000-000000000000	d3209ab2-1a39-4f59-8805-f990a76d2d57	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-18 18:43:49.388562+00	
00000000-0000-0000-0000-000000000000	6a7ef505-70a7-43ce-a63e-62950add13da	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-08-19 13:20:12.017406+00	
00000000-0000-0000-0000-000000000000	4d777672-1751-4a09-969f-2f7ca3be7458	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-21 05:25:59.229937+00	
00000000-0000-0000-0000-000000000000	63c637b6-aea7-418b-a530-654a05830e8f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-21 06:46:42.3157+00	
00000000-0000-0000-0000-000000000000	85795301-25da-45ac-ae64-5012a9a1921b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-21 12:38:26.597437+00	
00000000-0000-0000-0000-000000000000	8b034f34-879c-4b66-ac0c-6c33c02a74ca	{"action":"login","actor_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","actor_username":"matthias.baldi@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-21 14:26:44.299798+00	
00000000-0000-0000-0000-000000000000	35ee8b9b-4937-4a6c-a32a-d9cb537460c6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 06:24:46.292646+00	
00000000-0000-0000-0000-000000000000	f2bf9e42-fcdc-44b8-b588-eeac70fee901	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 07:32:28.744417+00	
00000000-0000-0000-0000-000000000000	33f03ad9-003a-480f-960c-268727f8f6ab	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 08:38:06.608569+00	
00000000-0000-0000-0000-000000000000	535f8de2-467a-476c-84e6-8d5bdd56a4ef	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 09:04:23.457435+00	
00000000-0000-0000-0000-000000000000	3ecb046c-1bc6-4655-bd3b-1deed3c5f21a	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 09:42:56.434235+00	
00000000-0000-0000-0000-000000000000	8f4d69fa-c282-45df-b182-9a1580f1675d	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-08-22 09:57:11.038135+00	
00000000-0000-0000-0000-000000000000	85f54401-97ee-4bfe-b404-a94278026386	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 11:34:29.430654+00	
00000000-0000-0000-0000-000000000000	1a89564d-b251-4cc4-9d1a-43ac23ea2631	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 12:37:08.723821+00	
00000000-0000-0000-0000-000000000000	297c4582-f98e-456a-833c-de848afedb13	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-22 13:37:11.264666+00	
00000000-0000-0000-0000-000000000000	e67c0314-4551-4e8c-87e4-0f174d1b6ce7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-23 05:53:46.92168+00	
00000000-0000-0000-0000-000000000000	6a91ecc4-82e6-48ee-bcc3-1587b9542c1d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-23 06:57:02.375117+00	
00000000-0000-0000-0000-000000000000	2954aa6c-f86f-499a-95ad-6afe7e1ef255	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-23 07:43:02.778151+00	
00000000-0000-0000-0000-000000000000	cb631a28-1427-48e2-b59f-b4d4f519f3c5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-23 09:01:32.26359+00	
00000000-0000-0000-0000-000000000000	f5e01822-a844-4efd-b7bb-f71c7da6c0cc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-23 10:11:59.068298+00	
00000000-0000-0000-0000-000000000000	f2835270-64bd-44e9-946b-370bb5743e6c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-24 06:07:51.215327+00	
00000000-0000-0000-0000-000000000000	f1bb3f3f-822c-4db4-9f8c-0fe938b35cb0	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-24 08:26:55.562375+00	
00000000-0000-0000-0000-000000000000	ec518778-b48e-48ba-93af-beb82471c849	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-25 06:28:29.432973+00	
00000000-0000-0000-0000-000000000000	398f5527-ab91-477c-b0bb-6f36227fb042	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-25 11:33:12.906422+00	
00000000-0000-0000-0000-000000000000	ec672fde-4a7b-444a-a9cb-09a36894e39b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-25 15:09:05.736347+00	
00000000-0000-0000-0000-000000000000	0274a9b7-7517-47a9-af00-638525799e62	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-25 15:09:14.527281+00	
00000000-0000-0000-0000-000000000000	114e34d3-1fda-4882-a05e-417d3b3f8522	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-28 06:01:12.260442+00	
00000000-0000-0000-0000-000000000000	f9456a20-4a53-4734-b694-654f4039997c	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-28 06:26:03.56264+00	
00000000-0000-0000-0000-000000000000	48c4f7b4-d2d0-439e-be21-914123133f36	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-28 09:17:48.264409+00	
00000000-0000-0000-0000-000000000000	7899330b-c9a7-415e-81c3-fae15917b444	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-28 12:32:50.258665+00	
00000000-0000-0000-0000-000000000000	d9c780bf-235f-42a2-905c-05d1f27fb7bc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-28 14:17:16.410051+00	
00000000-0000-0000-0000-000000000000	1069d4a9-ebf2-472e-9dfe-b77b3dc34300	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-29 06:05:25.813094+00	
00000000-0000-0000-0000-000000000000	6e8851b4-af2a-4380-af29-faa3771e20de	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-29 06:55:05.925819+00	
00000000-0000-0000-0000-000000000000	ae8af6a8-4aa7-46dd-8a6b-b5c5fdce6f3c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-29 06:55:37.778557+00	
00000000-0000-0000-0000-000000000000	073541e0-25a8-4cd6-bce1-e071204296f8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-29 08:11:41.129533+00	
00000000-0000-0000-0000-000000000000	afa81382-7c53-4711-88d4-62216c498536	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-29 09:14:10.102288+00	
00000000-0000-0000-0000-000000000000	250f36c6-fba6-4193-a676-35ff75c2f588	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"pfifi@bluewin.ch","user_id":"9e21182f-c7d8-4f94-a9cf-3871af4193ba","user_phone":""}}	2023-08-29 09:16:12.653097+00	
00000000-0000-0000-0000-000000000000	0fc6b0c8-293d-4226-b1cb-ef27d8a702be	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"pfifi@bluewin.ch","user_id":"f4814347-170c-409f-843b-5beca908fb03"}}	2023-08-29 09:17:00.35722+00	
00000000-0000-0000-0000-000000000000	cd2acd46-d18a-4b67-9c51-0e9d85691243	{"action":"user_signedup","actor_id":"f4814347-170c-409f-843b-5beca908fb03","actor_username":"pfifi@bluewin.ch","log_type":"team"}	2023-08-29 09:19:45.251823+00	
00000000-0000-0000-0000-000000000000	a1793181-709b-44e9-9a11-50acc76c5fda	{"action":"user_modified","actor_id":"f4814347-170c-409f-843b-5beca908fb03","actor_username":"pfifi@bluewin.ch","log_type":"user"}	2023-08-29 09:19:56.463563+00	
00000000-0000-0000-0000-000000000000	52b10bb6-b898-4d0f-bbcf-c589fc3730b9	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-29 09:20:23.662478+00	
00000000-0000-0000-0000-000000000000	694ef719-6805-4c93-b6e1-efa50901bd9b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-29 09:20:33.84629+00	
00000000-0000-0000-0000-000000000000	dfda6b06-5be9-4136-95dd-c1707eefac14	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-29 10:20:34.930724+00	
00000000-0000-0000-0000-000000000000	449f4843-a3ed-4645-8f1d-eb3ae487a4bb	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-30 06:28:33.619347+00	
00000000-0000-0000-0000-000000000000	25618531-bf16-41f5-a74f-1282b4f6754a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-30 06:28:39.710341+00	
00000000-0000-0000-0000-000000000000	ed3a7ed3-dd8f-4deb-8de3-1f1606fc864e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-30 06:36:19.961402+00	
00000000-0000-0000-0000-000000000000	2f7087b9-5872-484d-830c-cb68643e566e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-30 08:04:04.504084+00	
00000000-0000-0000-0000-000000000000	f7d40413-e0a8-4f46-8db9-97cf7385dfb0	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-30 09:31:42.623846+00	
00000000-0000-0000-0000-000000000000	5f66cdc0-3fa7-4fb0-bbba-cd969e650937	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-30 11:08:17.535108+00	
00000000-0000-0000-0000-000000000000	d57063e3-e5a1-4d88-b4db-8ec97036804f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-30 12:55:49.024565+00	
00000000-0000-0000-0000-000000000000	2709f311-3851-480c-9090-7d10a572db8d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-31 08:51:09.350556+00	
00000000-0000-0000-0000-000000000000	b57fca0b-1f3d-4d34-8c4e-ac4c9fc450c5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-31 09:58:10.856348+00	
00000000-0000-0000-0000-000000000000	10a525b1-5383-4200-b791-a96524efa8a6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-31 11:42:20.607681+00	
00000000-0000-0000-0000-000000000000	5fe990eb-d77e-4ca9-8cf3-5f59a5d9f268	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-31 13:15:00.868102+00	
00000000-0000-0000-0000-000000000000	cd1c0784-5278-49b4-b264-05231762889b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-08-31 14:16:54.811357+00	
00000000-0000-0000-0000-000000000000	d546240e-23fc-4d1a-a24d-ab7b01d6c0bf	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-08-31 15:13:19.309229+00	
00000000-0000-0000-0000-000000000000	f66f3898-5cb7-4d58-80ac-d20d0ffc824b	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-01 05:46:38.378211+00	
00000000-0000-0000-0000-000000000000	1ac60804-616f-42e6-a977-7b2dc5cb2d90	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-01 05:59:53.00638+00	
00000000-0000-0000-0000-000000000000	b6b1d0d6-f70b-4121-8826-bfa61875b605	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-01 06:35:39.466771+00	
00000000-0000-0000-0000-000000000000	9612c35b-4019-4b68-bc19-eba3374cb32d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-01 07:06:31.847842+00	
00000000-0000-0000-0000-000000000000	5d4108d7-6c2e-4cdf-886f-4e28c490dbcf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-01 08:08:18.461274+00	
00000000-0000-0000-0000-000000000000	2ff61ab7-1488-4508-aee1-5398981aaf55	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-01 09:30:34.154011+00	
00000000-0000-0000-0000-000000000000	a6512b99-f347-4a68-8097-74fa211e9c52	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-01 13:54:57.272537+00	
00000000-0000-0000-0000-000000000000	ab472d5b-2cf8-4ee0-a18e-de1c0cf407e3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-04 06:09:17.500911+00	
00000000-0000-0000-0000-000000000000	a811e08e-d228-4ba3-bbbd-54ededc9529e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-04 07:32:11.897674+00	
00000000-0000-0000-0000-000000000000	256deba9-545d-495a-bb59-7850a9b9cb2f	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-04 08:07:47.4378+00	
00000000-0000-0000-0000-000000000000	8656d024-d1a4-4054-ab8f-32065563002b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-04 08:32:18.250926+00	
00000000-0000-0000-0000-000000000000	bc9bf802-f876-41d6-a2c7-21d0d2836bc5	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-04 09:37:36.880434+00	
00000000-0000-0000-0000-000000000000	a31fd49d-4a52-46de-9518-2bf2c71044bd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-04 09:41:53.070888+00	
00000000-0000-0000-0000-000000000000	c8d6b35d-5e65-4190-b6bd-3534a94e6764	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-04 11:31:33.39853+00	
00000000-0000-0000-0000-000000000000	14583aa9-5f29-4ce8-98e3-af20a0c6ee21	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-04 11:38:08.670106+00	
00000000-0000-0000-0000-000000000000	28116ba7-33c0-4810-9b0c-957b367129ac	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-04 13:56:13.458389+00	
00000000-0000-0000-0000-000000000000	74df9eb2-072e-4f87-806c-0adf987bef13	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-04 14:11:12.391245+00	
00000000-0000-0000-0000-000000000000	b418d9fc-f217-4b26-8b11-80a05fa1dd5e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-04 15:24:33.423428+00	
00000000-0000-0000-0000-000000000000	a7e3a1f9-bffa-42b5-9fd0-749e36169567	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-04 15:31:46.833087+00	
00000000-0000-0000-0000-000000000000	f400b344-3d8b-40a6-aff2-9a80881800f5	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-04 18:16:48.668895+00	
00000000-0000-0000-0000-000000000000	4ead0710-f432-4045-bf29-2251156dd916	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-04 19:17:22.492099+00	
00000000-0000-0000-0000-000000000000	bdab9708-503e-44c4-a260-d6fe02d26833	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-04 20:20:13.559615+00	
00000000-0000-0000-0000-000000000000	6b77dc5b-ac63-4c18-9c07-77ab8cbf8e92	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 05:58:26.575813+00	
00000000-0000-0000-0000-000000000000	5d16a6a6-934e-4c6b-9a90-c9cad3394fc5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 06:11:07.0428+00	
00000000-0000-0000-0000-000000000000	fc908f27-8587-4435-a786-643ff4b5c321	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 07:01:20.570991+00	
00000000-0000-0000-0000-000000000000	d4728049-01ce-46cb-848f-41418d7babf1	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 08:07:11.103007+00	
00000000-0000-0000-0000-000000000000	f32fea5e-4090-4339-8528-131e2869b616	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 08:36:32.896441+00	
00000000-0000-0000-0000-000000000000	2eba508b-0ca0-4426-a4bb-582710546f16	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 09:07:23.105078+00	
00000000-0000-0000-0000-000000000000	41b3fca6-9de0-4ab8-9ea5-042889bc09b2	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-05 09:13:41.398789+00	
00000000-0000-0000-0000-000000000000	6f2043e7-2de8-48ad-9908-bb0d0a56be2d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 12:17:07.992574+00	
00000000-0000-0000-0000-000000000000	d203116f-4a83-49ed-b9d8-28f4e86c3bb0	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"leonora.lehmann@bluewin.ch","user_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39"}}	2023-09-05 13:01:07.135866+00	
00000000-0000-0000-0000-000000000000	9e1a119b-c112-4533-8299-27a131bc2396	{"action":"user_signedup","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"team"}	2023-09-05 13:01:59.737083+00	
00000000-0000-0000-0000-000000000000	20477b21-7a10-42de-8c2a-5af90da517ea	{"action":"user_modified","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"user"}	2023-09-05 13:02:17.428452+00	
00000000-0000-0000-0000-000000000000	75fb395c-4aa6-4ffa-9ec6-5331f6caa4c8	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 13:04:46.865411+00	
00000000-0000-0000-0000-000000000000	943e0fb2-1dc4-4dd3-a79c-493b8ea69ceb	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 13:05:05.61682+00	
00000000-0000-0000-0000-000000000000	6a13fe8a-8d36-46b7-bfee-50c331aac914	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 13:05:42.693286+00	
00000000-0000-0000-0000-000000000000	a8dcfbbb-5cf3-45a4-bda1-20d9843c07c2	{"action":"user_recovery_requested","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"user"}	2023-09-05 13:06:15.133122+00	
00000000-0000-0000-0000-000000000000	3842a430-5001-4610-9866-1c7844ca5fdc	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account"}	2023-09-05 13:06:22.224524+00	
00000000-0000-0000-0000-000000000000	87b1acc4-6d93-40be-bcd1-7a63f5dc8a6f	{"action":"user_modified","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"user"}	2023-09-05 13:06:34.338951+00	
00000000-0000-0000-0000-000000000000	f4f7aa57-0b60-44db-9e0c-b4f6bd7d4767	{"action":"logout","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account"}	2023-09-05 13:06:41.706947+00	
00000000-0000-0000-0000-000000000000	370c82dc-c5b4-4932-9f5d-cfa468a85ef5	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-05 13:06:56.972767+00	
00000000-0000-0000-0000-000000000000	bd9026b1-12f9-42ed-b7bd-6000aca3d478	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 05:44:35.93978+00	
00000000-0000-0000-0000-000000000000	f8b79a51-a4e4-408f-909e-e5561a81199f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 09:13:55.617223+00	
00000000-0000-0000-0000-000000000000	1eab29c7-cd0a-40f3-a24a-0007342bc97b	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-06 09:34:59.434726+00	
00000000-0000-0000-0000-000000000000	c57e06b3-2a29-4b3d-a69f-d97970fd27c6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 10:01:17.502173+00	
00000000-0000-0000-0000-000000000000	3941acc6-e327-40ef-b4cf-0711a5ea9b08	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"salome.signer@swisstopo.ch","user_id":"052bba0f-4e48-4802-b1c6-db8f496c3d0f"}}	2023-09-06 10:02:01.269619+00	
00000000-0000-0000-0000-000000000000	01fd7caf-21e9-483e-8eff-d1e35f260949	{"action":"user_signedup","actor_id":"052bba0f-4e48-4802-b1c6-db8f496c3d0f","actor_username":"salome.signer@swisstopo.ch","log_type":"team"}	2023-09-06 11:16:35.992638+00	
00000000-0000-0000-0000-000000000000	50f022c5-4923-414f-80e9-6cc48f9f8b64	{"action":"user_modified","actor_id":"052bba0f-4e48-4802-b1c6-db8f496c3d0f","actor_username":"salome.signer@swisstopo.ch","log_type":"user"}	2023-09-06 11:17:06.954597+00	
00000000-0000-0000-0000-000000000000	035716ce-2a04-49f2-bcac-3e2b5bcdd67d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 11:21:06.165402+00	
00000000-0000-0000-0000-000000000000	186d85d3-e1eb-4fe1-8b6b-34844d130eb7	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 11:37:16.340148+00	
00000000-0000-0000-0000-000000000000	950a60ac-2c57-4a64-842c-05648fec0c61	{"action":"login","actor_id":"052bba0f-4e48-4802-b1c6-db8f496c3d0f","actor_username":"salome.signer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 13:14:30.570651+00	
00000000-0000-0000-0000-000000000000	fa533b7f-7b58-41c9-a267-61cbbf187a70	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 13:46:35.399739+00	
00000000-0000-0000-0000-000000000000	52d66980-48ec-4c10-814f-a7bfe11b37ad	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-06 13:47:53.219724+00	
00000000-0000-0000-0000-000000000000	ae9b0c60-6513-40a9-83ed-325708ae050f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-07 05:57:56.36969+00	
00000000-0000-0000-0000-000000000000	60e59dba-2cc2-4a29-90a1-570dd755f94a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-07 06:57:59.594878+00	
00000000-0000-0000-0000-000000000000	39986517-50ae-45f3-b72d-816fa8e4c4ea	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-07 07:25:23.549284+00	
00000000-0000-0000-0000-000000000000	729bd46b-82d0-4e05-ad69-050ad82ca276	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-07 08:31:51.491123+00	
00000000-0000-0000-0000-000000000000	8e66adb0-f806-4f54-b281-114d065a8c58	{"action":"logout","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account"}	2023-09-07 09:26:38.562455+00	
00000000-0000-0000-0000-000000000000	c1cf79a6-9e88-4d0b-95a1-5e67135db8e5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-07 13:13:36.345829+00	
00000000-0000-0000-0000-000000000000	327c9bd0-4c89-483b-8453-2ac050261748	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"geolinfo@swisstopo.ch","user_id":"5e59928f-c594-44ba-97eb-dcface47c674"}}	2023-09-07 14:01:34.130831+00	
00000000-0000-0000-0000-000000000000	0137d39b-8219-4669-8fac-7ef95a2423a4	{"action":"user_signedup","actor_id":"5e59928f-c594-44ba-97eb-dcface47c674","actor_username":"geolinfo@swisstopo.ch","log_type":"team"}	2023-09-07 14:01:45.802874+00	
00000000-0000-0000-0000-000000000000	ca213d1e-ed41-476e-bbea-cb115846f49d	{"action":"user_modified","actor_id":"5e59928f-c594-44ba-97eb-dcface47c674","actor_username":"geolinfo@swisstopo.ch","log_type":"user"}	2023-09-07 14:02:31.386988+00	
00000000-0000-0000-0000-000000000000	56d00516-28fc-4689-b196-054e5fbab571	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-07 14:12:09.607553+00	
00000000-0000-0000-0000-000000000000	e2949fdb-a6cb-46d6-a198-7c6ad04da9f1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-07 14:14:12.269195+00	
00000000-0000-0000-0000-000000000000	728a653f-7078-43a3-9c0e-bb414f65bf38	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-07 17:50:24.426156+00	
00000000-0000-0000-0000-000000000000	0a75db0b-37c9-40c8-98a9-3b01c64bb995	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-09-07 19:02:41.133507+00	
00000000-0000-0000-0000-000000000000	486ccb67-dac9-4e71-8d55-cba5e1fcd2bf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-08 07:08:15.627722+00	
00000000-0000-0000-0000-000000000000	adf7ba79-da90-4a97-8985-3100a649e91d	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"jufrlke@bluewin.ch","user_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139"}}	2023-09-08 07:09:40.446712+00	
00000000-0000-0000-0000-000000000000	939120d9-c925-4ad1-ab47-62ee0cce24a8	{"action":"user_signedup","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"team"}	2023-09-08 07:54:05.55753+00	
00000000-0000-0000-0000-000000000000	b13a9b4d-7002-4e6f-b1a5-da921ed8eba8	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-08 07:54:09.205175+00	
00000000-0000-0000-0000-000000000000	14ec2de8-4d7a-4bea-92d6-e0b796002ebd	{"action":"user_modified","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"user"}	2023-09-08 07:54:22.703293+00	
00000000-0000-0000-0000-000000000000	1e617133-8b6e-40bc-91f2-a9abf31be07b	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-08 12:28:34.76131+00	
00000000-0000-0000-0000-000000000000	c3b2a411-b776-4e92-a8df-0a4f40800201	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 06:17:27.238924+00	
00000000-0000-0000-0000-000000000000	5f8672c1-ff77-429c-b2ad-b2a3bffb986c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 09:10:34.857243+00	
00000000-0000-0000-0000-000000000000	51eeddf1-6ea9-4e9f-b81b-1c95373d9d68	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 11:35:00.320087+00	
00000000-0000-0000-0000-000000000000	c8d19bec-27c0-49da-977d-e10315c6ee03	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 12:05:32.917586+00	
00000000-0000-0000-0000-000000000000	e617dfe6-1142-4425-94e6-ce1aa0e6bb07	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 13:37:50.156509+00	
00000000-0000-0000-0000-000000000000	87a795a5-3442-4610-aa40-957c05217ce1	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-11 13:39:38.231607+00	
00000000-0000-0000-0000-000000000000	b800af4e-2aac-4c16-8e83-700d31327485	{"action":"login","actor_id":"5e59928f-c594-44ba-97eb-dcface47c674","actor_username":"geolinfo@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 13:41:25.211853+00	
00000000-0000-0000-0000-000000000000	d341ab59-416c-44bb-b850-460beae9656b	{"action":"login","actor_id":"5e59928f-c594-44ba-97eb-dcface47c674","actor_username":"geolinfo@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 13:42:46.850152+00	
00000000-0000-0000-0000-000000000000	e337de2b-684c-4275-ae82-67c3a81876c3	{"action":"logout","actor_id":"5e59928f-c594-44ba-97eb-dcface47c674","actor_username":"geolinfo@swisstopo.ch","log_type":"account"}	2023-09-11 13:45:35.490828+00	
00000000-0000-0000-0000-000000000000	6921f4a0-f661-4f7d-9ef4-d0241db0b98d	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 13:46:13.774919+00	
00000000-0000-0000-0000-000000000000	a7989625-afc8-4cd3-97df-e84475507fb1	{"action":"logout","actor_id":"5e59928f-c594-44ba-97eb-dcface47c674","actor_username":"geolinfo@swisstopo.ch","log_type":"account"}	2023-09-11 13:46:38.832087+00	
00000000-0000-0000-0000-000000000000	512f8580-1fe6-46c1-b313-0b4c3bff46e2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 13:46:41.744532+00	
00000000-0000-0000-0000-000000000000	6ae3a44b-8487-4c60-9a54-faba5d53ea0f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 13:58:54.357747+00	
00000000-0000-0000-0000-000000000000	6cde61ee-f590-45bb-a3a2-b40fd1a4d851	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-11 13:59:13.419451+00	
00000000-0000-0000-0000-000000000000	0d17e4f8-5f0d-4ec0-ae37-99db241bf40a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-11 14:36:48.361383+00	
00000000-0000-0000-0000-000000000000	015bc1b9-37e3-4124-89f0-d8fd16fc3bec	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 14:38:44.417514+00	
00000000-0000-0000-0000-000000000000	b5781c9d-dd8a-4a9e-b31e-830898e6d859	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-11 14:48:29.453154+00	
00000000-0000-0000-0000-000000000000	2b0e4ec4-6fd8-47fc-acea-cedb4be0a46b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-11 14:49:40.440054+00	
00000000-0000-0000-0000-000000000000	940bef5e-c384-46be-9093-7edc8e7fa0e4	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-11 15:24:22.604103+00	
00000000-0000-0000-0000-000000000000	0570c6f9-548b-4041-b1bf-3a65a651438c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-12 06:17:01.847237+00	
00000000-0000-0000-0000-000000000000	2087546e-7d55-4b66-b789-4c33bb479ca7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 06:11:32.497313+00	
00000000-0000-0000-0000-000000000000	c67d6980-5a13-46cb-b467-6e5bf03374ae	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-13 06:34:29.288035+00	
00000000-0000-0000-0000-000000000000	7df21ba7-6db2-419f-a0a2-32cb4c8d6693	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 06:35:34.912208+00	
00000000-0000-0000-0000-000000000000	5c4cb3de-aff9-4175-9423-303b1c14303f	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"robin.allenbach@swisstopo.ch","user_id":"668c355c-6d5f-4a11-8ffe-655910c60e37"}}	2023-09-13 06:38:51.537713+00	
00000000-0000-0000-0000-000000000000	2ddd54cd-0bca-49f5-a3da-32a35db93000	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nathalie.andenmattenberthoud@swisstopo.ch","user_id":"53721208-8733-4dce-a7de-20fcc53a2eaf"}}	2023-09-13 06:40:31.519871+00	
00000000-0000-0000-0000-000000000000	dfe57c9e-c4ee-437a-8b35-c81af71319ad	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"christian.ansorge@swisstopo.ch","user_id":"423ec6d6-9187-4802-b5da-6372d97e9053"}}	2023-09-13 06:41:16.682412+00	
00000000-0000-0000-0000-000000000000	0a8cded9-6ae5-402b-b6ef-8b2c83b275a7	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"pauline.baland@swisstopo.ch","user_id":"1995e110-98cb-4a27-9bb4-84734b8dd102"}}	2023-09-13 06:41:54.690668+00	
00000000-0000-0000-0000-000000000000	c207452c-ef36-4c7a-8b69-9aeba94d48f4	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"roland.baumberger@swisstopo.ch","user_id":"6b96221f-4b78-4d4a-82c4-3afb64233abd"}}	2023-09-13 06:42:20.834482+00	
00000000-0000-0000-0000-000000000000	7248c03c-09b3-4a2d-b880-134dbaef0cd1	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"reto.burkhalter@swisstopo.ch","user_id":"eee9d0d2-7d6e-450d-8b0d-581ba19141c9"}}	2023-09-13 06:42:52.335876+00	
00000000-0000-0000-0000-000000000000	9abf5fa4-9dd6-4137-8a1f-b68f5946d3f1	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stephan.dallagnolo@swisstopo.ch","user_id":"3ddc99b1-a269-49a8-a693-c0fd68d39a20"}}	2023-09-13 06:43:32.036072+00	
00000000-0000-0000-0000-000000000000	2a984e15-64cb-46de-9ca4-ba85ee90ef88	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"claire.epiney@swisstopo.ch","user_id":"1ccb8ecf-3d81-4864-b008-879a89a74ed1"}}	2023-09-13 06:44:04.152441+00	
00000000-0000-0000-0000-000000000000	30cccbc5-63d7-4142-a26e-c1956f2885da	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"thomas.galfetti@swisstopo.ch","user_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b"}}	2023-09-13 06:44:34.582948+00	
00000000-0000-0000-0000-000000000000	f82f7577-39dc-4725-b0db-2fc7250a4fcd	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"yves.gouffon@swisstopo.ch","user_id":"2c14f694-9727-4a00-82ba-ffe95995daba"}}	2023-09-13 06:44:59.879321+00	
00000000-0000-0000-0000-000000000000	1bc66b2c-869c-4aba-9926-79276f057d12	{"action":"user_recovery_requested","actor_id":"afe4b578-1ae4-4bbf-a595-b2c2789a77b4","actor_username":"daniel.gechter@swisstopo.ch","log_type":"user"}	2023-09-13 06:45:22.006774+00	
00000000-0000-0000-0000-000000000000	9bc051b4-e8b6-492d-92ac-aba1979a8d28	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"david.jaeggi@swisstopo.ch","user_id":"d6715729-84ff-444b-9805-2f64ce9ed513"}}	2023-09-13 06:45:24.289663+00	
00000000-0000-0000-0000-000000000000	7f25c7a7-b690-48b9-9b51-a6b6b4cff006	{"action":"user_signedup","actor_id":"afe4b578-1ae4-4bbf-a595-b2c2789a77b4","actor_username":"daniel.gechter@swisstopo.ch","log_type":"team"}	2023-09-13 06:45:33.875854+00	
00000000-0000-0000-0000-000000000000	df7a5e1b-a8df-4492-94e7-b2d28dd12f48	{"action":"user_signedup","actor_id":"3ddc99b1-a269-49a8-a693-c0fd68d39a20","actor_username":"stephan.dallagnolo@swisstopo.ch","log_type":"team"}	2023-09-13 06:45:34.67805+00	
00000000-0000-0000-0000-000000000000	37b5a5aa-967e-45a7-b69d-c1ef747da689	{"action":"user_modified","actor_id":"afe4b578-1ae4-4bbf-a595-b2c2789a77b4","actor_username":"daniel.gechter@swisstopo.ch","log_type":"user"}	2023-09-13 06:45:48.249368+00	
00000000-0000-0000-0000-000000000000	a2019ee9-5558-4b98-8114-5916d50872b6	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"daniel.kaelin@swisstopo.ch","user_id":"05b83aa4-1715-4ad1-abfd-dba964b81f27"}}	2023-09-13 06:45:49.039614+00	
00000000-0000-0000-0000-000000000000	9b1b14d4-29cf-4b4e-879b-71d9e7b3110f	{"action":"user_modified","actor_id":"3ddc99b1-a269-49a8-a693-c0fd68d39a20","actor_username":"stephan.dallagnolo@swisstopo.ch","log_type":"user"}	2023-09-13 06:45:58.609231+00	
00000000-0000-0000-0000-000000000000	756b169a-5ab2-44ea-8818-88553ddc1e1c	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"oliver.kempf@swisstopo.ch","user_id":"ad79ba6c-2fc8-4f72-a4e1-05240939d595"}}	2023-09-13 06:46:16.350585+00	
00000000-0000-0000-0000-000000000000	1090c6e1-64ee-45eb-a93f-312ad34b1f01	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"eva.kurmann@swisstopo.ch","user_id":"b934b581-90e9-41ba-af3f-73692f65f095"}}	2023-09-13 06:51:33.193541+00	
00000000-0000-0000-0000-000000000000	281a9dba-9457-47d2-8a81-9209bd9b148e	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"herfried.madritsch@swisstopo.ch","user_id":"b66fde4d-a6f4-4c7e-8617-c26429562e4d"}}	2023-09-13 06:52:25.684487+00	
00000000-0000-0000-0000-000000000000	887b7eca-b8ea-4483-af43-a9ffececac2c	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"marc.monnerat@swisstopo.ch","user_id":"c78ef091-20e0-469d-924c-c3965d0a627b"}}	2023-09-13 06:52:51.276195+00	
00000000-0000-0000-0000-000000000000	5c12f839-e0a3-4e2e-8cc9-da17cf2a5490	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"alain.morard@swisstopo.ch","user_id":"704d43de-7fd6-48b2-bbac-ff661132144e"}}	2023-09-13 06:53:14.499194+00	
00000000-0000-0000-0000-000000000000	22d821c1-ce80-499d-8ba3-acf7d997f825	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"andreas.moeri@swisstopo.ch","user_id":"5ae4e2f6-8bac-4eac-90e0-d510fad92f5c"}}	2023-09-13 06:53:43.705426+00	
00000000-0000-0000-0000-000000000000	a91aed19-2566-425e-82ac-f6cc37087ea5	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"ferdinando.mussopiantelli@swisstopo.ch","user_id":"ce286136-6622-4f3c-8f20-bdd27dd2c6ca"}}	2023-09-13 06:54:38.348555+00	
00000000-0000-0000-0000-000000000000	2b127c7c-b8c2-4a03-a3df-0f00b97fdbac	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"christophe.nussbaum@swisstopo.ch","user_id":"d4ba8c9a-ca08-4d55-a928-4892f5cb5e6d"}}	2023-09-13 06:55:10.324983+00	
00000000-0000-0000-0000-000000000000	1e77a30a-e51a-4128-a2c0-8b2f84161c65	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"lance.reynolds@swisstopo.ch","user_id":"442cd562-309d-4e58-879b-2abf7d5dbee9"}}	2023-09-13 06:55:35.212528+00	
00000000-0000-0000-0000-000000000000	f8250161-beab-4105-a600-48b7c3866922	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"senecio.schefer@swisstopo.ch","user_id":"e305338c-ae72-41ed-9cf9-4487db86b1d4"}}	2023-09-13 06:56:04.614948+00	
00000000-0000-0000-0000-000000000000	f371df78-930d-44c7-868b-bf6067a695c3	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"laurent.scheurer@swisstopo.ch","user_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c"}}	2023-09-13 06:56:34.748281+00	
00000000-0000-0000-0000-000000000000	8a0004f0-a33a-493c-8fe7-8d26765d4280	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"milenarose.scrignari@swisstopo.ch","user_id":"5f91ce96-defb-4f1f-9c30-655773f11494"}}	2023-09-13 06:57:02.063836+00	
00000000-0000-0000-0000-000000000000	9310e150-cbed-44bf-a1b0-49c07e151dac	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stefan.strasky@swisstopo.ch","user_id":"06ff93e5-b026-4efc-a899-be2bd33487d2"}}	2023-09-13 06:57:29.77041+00	
00000000-0000-0000-0000-000000000000	d87e6d6e-35f5-4647-b87e-4ff9504117a7	{"action":"user_signedup","actor_id":"c78ef091-20e0-469d-924c-c3965d0a627b","actor_username":"marc.monnerat@swisstopo.ch","log_type":"team"}	2023-09-13 06:57:40.048755+00	
00000000-0000-0000-0000-000000000000	937f27f0-97b1-40c5-b89c-e509c08b85ce	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"anina.ursprung@swisstopo.ch","user_id":"29848f76-e923-4b33-9ed1-a76961bef372"}}	2023-09-13 06:57:52.536003+00	
00000000-0000-0000-0000-000000000000	154db1fe-682d-4e75-8771-8b926ae73140	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"sandrine.vallin@swisstopo.ch","user_id":"6c694c4e-0cbe-479f-93de-126dd9ac95a9"}}	2023-09-13 06:58:17.063088+00	
00000000-0000-0000-0000-000000000000	a883e186-f9b9-4c4b-a09e-e3f963eb3e79	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"philip.wehrens@swisstopo.ch","user_id":"83fc2446-4132-4a83-b6dd-7d117cceed26"}}	2023-09-13 06:58:40.754487+00	
00000000-0000-0000-0000-000000000000	c2a331bc-5134-4d40-8494-c382ae129fe9	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stefan.volken@swisstopo.ch","user_id":"ee44378b-bb2c-41b3-95d6-3c492614687a"}}	2023-09-13 06:59:01.127321+00	
00000000-0000-0000-0000-000000000000	970b4d66-5973-4497-92a7-3484fcbc14d6	{"action":"user_modified","actor_id":"c78ef091-20e0-469d-924c-c3965d0a627b","actor_username":"marc.monnerat@swisstopo.ch","log_type":"user"}	2023-09-13 06:59:01.666661+00	
00000000-0000-0000-0000-000000000000	a793ff56-3a9a-4385-b85e-8d226cdf25e3	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"michael.wiederkehr@swisstopo.ch","user_id":"da752d9c-a284-4954-90cf-5479d4f70b8f"}}	2023-09-13 06:59:20.131593+00	
00000000-0000-0000-0000-000000000000	4e8fcc6c-af84-4f68-9c4a-a049af6d4147	{"action":"user_signedup","actor_id":"06ff93e5-b026-4efc-a899-be2bd33487d2","actor_username":"stefan.strasky@swisstopo.ch","log_type":"team"}	2023-09-13 06:59:40.839741+00	
00000000-0000-0000-0000-000000000000	40c3fb2c-3bee-44c0-9d50-1ee30fd782ca	{"action":"user_modified","actor_id":"06ff93e5-b026-4efc-a899-be2bd33487d2","actor_username":"stefan.strasky@swisstopo.ch","log_type":"user"}	2023-09-13 06:59:58.894334+00	
00000000-0000-0000-0000-000000000000	4e8d9852-6d61-4f08-a30d-ab34e1d2f026	{"action":"login","actor_id":"c78ef091-20e0-469d-924c-c3965d0a627b","actor_username":"marc.monnerat@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 07:00:13.115739+00	
00000000-0000-0000-0000-000000000000	86f560b7-232b-43c0-8f91-8f29bc057a5c	{"action":"login","actor_id":"c78ef091-20e0-469d-924c-c3965d0a627b","actor_username":"marc.monnerat@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 07:00:23.433727+00	
00000000-0000-0000-0000-000000000000	10290773-108e-49f6-896e-7a838d5d73ba	{"action":"login","actor_id":"c78ef091-20e0-469d-924c-c3965d0a627b","actor_username":"marc.monnerat@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 07:00:38.350444+00	
00000000-0000-0000-0000-000000000000	11f32a16-715b-4058-9425-4003d1b6822c	{"action":"user_signedup","actor_id":"83fc2446-4132-4a83-b6dd-7d117cceed26","actor_username":"philip.wehrens@swisstopo.ch","log_type":"team"}	2023-09-13 07:02:56.319446+00	
00000000-0000-0000-0000-000000000000	9ea82a9f-6a3f-4854-ba33-fe3b03b5b32e	{"action":"user_modified","actor_id":"83fc2446-4132-4a83-b6dd-7d117cceed26","actor_username":"philip.wehrens@swisstopo.ch","log_type":"user"}	2023-09-13 07:06:24.680343+00	
00000000-0000-0000-0000-000000000000	6a02f7d5-b015-4317-80fb-189b300804ee	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 07:21:09.137092+00	
00000000-0000-0000-0000-000000000000	86ec746d-b5e2-4cd7-a882-4eccc77107f2	{"action":"user_signedup","actor_id":"2c14f694-9727-4a00-82ba-ffe95995daba","actor_username":"yves.gouffon@swisstopo.ch","log_type":"team"}	2023-09-13 07:28:38.213202+00	
00000000-0000-0000-0000-000000000000	45407313-2a9a-491a-b857-5b688b5046db	{"action":"user_modified","actor_id":"2c14f694-9727-4a00-82ba-ffe95995daba","actor_username":"yves.gouffon@swisstopo.ch","log_type":"user"}	2023-09-13 07:29:30.994573+00	
00000000-0000-0000-0000-000000000000	a709338a-39f4-4753-b52c-44c32d4d9e88	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 07:35:39.148549+00	
00000000-0000-0000-0000-000000000000	0da667d6-0536-41b1-a458-9ba2c769e539	{"action":"user_signedup","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"team"}	2023-09-13 07:46:40.488051+00	
00000000-0000-0000-0000-000000000000	0bbb2e87-9870-45eb-8425-858039296c47	{"action":"user_modified","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"user"}	2023-09-13 07:47:31.512161+00	
00000000-0000-0000-0000-000000000000	3394c5d1-824d-4865-8ea2-1aeab6c0527f	{"action":"user_recovery_requested","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"user"}	2023-09-13 08:10:16.210588+00	
00000000-0000-0000-0000-000000000000	19655ca9-0f5e-4ea3-95f3-7072ffb0aea7	{"action":"user_signedup","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"team"}	2023-09-13 08:10:24.203848+00	
00000000-0000-0000-0000-000000000000	26f33527-d4d7-4ab7-84e2-1ac0d8a8cd94	{"action":"user_modified","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"user"}	2023-09-13 08:10:39.275375+00	
00000000-0000-0000-0000-000000000000	a441ff7d-b33e-48fc-b272-9ec40e934069	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 08:23:16.379559+00	
00000000-0000-0000-0000-000000000000	623a7310-688d-495f-8c3a-21ff12eff983	{"action":"user_signedup","actor_id":"5ae4e2f6-8bac-4eac-90e0-d510fad92f5c","actor_username":"andreas.moeri@swisstopo.ch","log_type":"team"}	2023-09-13 08:26:49.880527+00	
00000000-0000-0000-0000-000000000000	04579e5f-e5ad-4620-822f-1211314515fc	{"action":"user_modified","actor_id":"5ae4e2f6-8bac-4eac-90e0-d510fad92f5c","actor_username":"andreas.moeri@swisstopo.ch","log_type":"user"}	2023-09-13 08:28:19.172153+00	
00000000-0000-0000-0000-000000000000	f2c318ab-26e8-464c-b8f5-998be7988069	{"action":"login","actor_id":"2c14f694-9727-4a00-82ba-ffe95995daba","actor_username":"yves.gouffon@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 08:29:39.902294+00	
00000000-0000-0000-0000-000000000000	9d342317-a91f-4e94-9d8e-94c98d26e4cf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 08:35:49.209294+00	
00000000-0000-0000-0000-000000000000	72f84932-5af1-4fa3-8394-d66fdcbda414	{"action":"login","actor_id":"c78ef091-20e0-469d-924c-c3965d0a627b","actor_username":"marc.monnerat@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 08:59:31.483662+00	
00000000-0000-0000-0000-000000000000	0f67891a-2239-4ba7-afe3-621aa148a96c	{"action":"user_signedup","actor_id":"6b96221f-4b78-4d4a-82c4-3afb64233abd","actor_username":"roland.baumberger@swisstopo.ch","log_type":"team"}	2023-09-13 09:10:57.09901+00	
00000000-0000-0000-0000-000000000000	54369ec8-fa05-43ce-bbca-3a196ce74b9f	{"action":"user_modified","actor_id":"6b96221f-4b78-4d4a-82c4-3afb64233abd","actor_username":"roland.baumberger@swisstopo.ch","log_type":"user"}	2023-09-13 09:11:25.226535+00	
00000000-0000-0000-0000-000000000000	0fb92cab-1b39-44f9-be02-f97d657eba87	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 09:25:19.730689+00	
00000000-0000-0000-0000-000000000000	f469ad2c-16d1-4da1-8842-7ba51a6cc0bb	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-13 09:43:50.617367+00	
00000000-0000-0000-0000-000000000000	8ce08349-6371-4073-a41d-6755e0a83d78	{"action":"user_signedup","actor_id":"1995e110-98cb-4a27-9bb4-84734b8dd102","actor_username":"pauline.baland@swisstopo.ch","log_type":"team"}	2023-09-13 09:43:57.962163+00	
00000000-0000-0000-0000-000000000000	85069a23-5d09-453a-a685-42a0b36267b9	{"action":"user_modified","actor_id":"1995e110-98cb-4a27-9bb4-84734b8dd102","actor_username":"pauline.baland@swisstopo.ch","log_type":"user"}	2023-09-13 09:44:03.500342+00	
00000000-0000-0000-0000-000000000000	1c454489-f3ef-40e6-84f2-c9df5a8da698	{"action":"login","actor_id":"6b96221f-4b78-4d4a-82c4-3afb64233abd","actor_username":"roland.baumberger@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 09:59:09.026419+00	
00000000-0000-0000-0000-000000000000	e6c8a17b-4b4d-4b3d-ba97-3175db790522	{"action":"user_signedup","actor_id":"eee9d0d2-7d6e-450d-8b0d-581ba19141c9","actor_username":"reto.burkhalter@swisstopo.ch","log_type":"team"}	2023-09-13 11:10:30.066523+00	
00000000-0000-0000-0000-000000000000	30728e25-547e-48a1-bc5b-3c7bed903fa2	{"action":"user_modified","actor_id":"eee9d0d2-7d6e-450d-8b0d-581ba19141c9","actor_username":"reto.burkhalter@swisstopo.ch","log_type":"user"}	2023-09-13 11:15:28.100421+00	
00000000-0000-0000-0000-000000000000	881d4689-9d77-4a49-aad0-2e2611866c37	{"action":"login","actor_id":"eee9d0d2-7d6e-450d-8b0d-581ba19141c9","actor_username":"reto.burkhalter@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 11:20:03.287377+00	
00000000-0000-0000-0000-000000000000	85762b5c-646b-47ee-9c61-d8bd3fba576e	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 11:40:58.022397+00	
00000000-0000-0000-0000-000000000000	c469188b-b581-4db5-966c-d9b52f7ad6f4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 12:46:23.150581+00	
00000000-0000-0000-0000-000000000000	736cf0ac-ce68-4a8d-84cb-05b365405d47	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"geolinfo@swisstopo.ch","user_id":"5e59928f-c594-44ba-97eb-dcface47c674","user_phone":""}}	2023-09-13 12:46:39.234969+00	
00000000-0000-0000-0000-000000000000	dc50aaa6-a002-43ce-9c5d-8489d8091f53	{"action":"login","actor_id":"3ddc99b1-a269-49a8-a693-c0fd68d39a20","actor_username":"stephan.dallagnolo@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 13:14:54.463072+00	
00000000-0000-0000-0000-000000000000	f102c836-4b8c-45f9-bc2b-f11e093203a6	{"action":"login","actor_id":"5ae4e2f6-8bac-4eac-90e0-d510fad92f5c","actor_username":"andreas.moeri@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 13:21:29.461965+00	
00000000-0000-0000-0000-000000000000	65720642-c952-4f08-a1f7-76ea3a373666	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 13:47:31.866875+00	
00000000-0000-0000-0000-000000000000	7df34f1c-4587-48a8-a68c-d2b00256edd1	{"action":"user_signedup","actor_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","actor_username":"robin.allenbach@swisstopo.ch","log_type":"team"}	2023-09-13 14:08:21.928634+00	
00000000-0000-0000-0000-000000000000	4dff1780-e000-4f03-8251-13cbe2451455	{"action":"user_modified","actor_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","actor_username":"robin.allenbach@swisstopo.ch","log_type":"user"}	2023-09-13 14:11:03.674471+00	
00000000-0000-0000-0000-000000000000	90595734-4857-4476-b641-1375830ad698	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 15:04:44.780278+00	
00000000-0000-0000-0000-000000000000	5afd3857-25ad-44dc-a1d7-578208c2bd8a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-09-13 15:15:36.861178+00	
00000000-0000-0000-0000-000000000000	48d9c475-7e5f-4fb5-9c69-5607fbcfd000	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 18:27:37.265724+00	
00000000-0000-0000-0000-000000000000	579e707f-92e6-4178-82d0-0baa0b10da92	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-13 19:31:00.632395+00	
00000000-0000-0000-0000-000000000000	1e66af4c-0eda-4b2e-a84c-e37a7d9b9b1a	{"action":"login","actor_id":"06ff93e5-b026-4efc-a899-be2bd33487d2","actor_username":"stefan.strasky@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 06:23:22.759564+00	
00000000-0000-0000-0000-000000000000	5ca504df-c808-4fef-bc99-7d3f3a498e38	{"action":"user_recovery_requested","actor_id":"05b83aa4-1715-4ad1-abfd-dba964b81f27","actor_username":"daniel.kaelin@swisstopo.ch","log_type":"user"}	2023-09-14 08:00:58.508807+00	
00000000-0000-0000-0000-000000000000	cc7ddb95-0f11-4979-9d04-bf0e8f8e0d27	{"action":"user_signedup","actor_id":"05b83aa4-1715-4ad1-abfd-dba964b81f27","actor_username":"daniel.kaelin@swisstopo.ch","log_type":"team"}	2023-09-14 08:01:05.569476+00	
00000000-0000-0000-0000-000000000000	3d4ea4c0-883f-4466-a2b6-9f5aa3946dd8	{"action":"user_modified","actor_id":"05b83aa4-1715-4ad1-abfd-dba964b81f27","actor_username":"daniel.kaelin@swisstopo.ch","log_type":"user"}	2023-09-14 08:01:16.534163+00	
00000000-0000-0000-0000-000000000000	d27005f0-0fb8-40a8-aa75-92ec971f8ef4	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-24 07:10:40.764086+00	
00000000-0000-0000-0000-000000000000	e71eef3e-bb64-4158-bf43-e874d6f6a986	{"action":"login","actor_id":"06ff93e5-b026-4efc-a899-be2bd33487d2","actor_username":"stefan.strasky@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 08:30:58.936572+00	
00000000-0000-0000-0000-000000000000	0fb4cefe-9e40-43d3-9345-a8de14256895	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 08:45:05.406857+00	
00000000-0000-0000-0000-000000000000	16668a46-2756-4095-b71f-e5f255e30442	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 09:59:17.16828+00	
00000000-0000-0000-0000-000000000000	657f5edf-f61c-460e-8a0c-a42d75f8f54c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 11:10:43.771094+00	
00000000-0000-0000-0000-000000000000	ea8a1339-ed85-46a9-976b-63934e34bd8b	{"action":"login","actor_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","actor_username":"robin.allenbach@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 11:14:22.497782+00	
00000000-0000-0000-0000-000000000000	79c4e163-ab3e-471d-8f57-273891b411bf	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 11:14:29.7439+00	
00000000-0000-0000-0000-000000000000	2ac524ad-2c5a-485c-850c-ec60e074af27	{"action":"login","actor_id":"05b83aa4-1715-4ad1-abfd-dba964b81f27","actor_username":"daniel.kaelin@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 11:39:44.579729+00	
00000000-0000-0000-0000-000000000000	fad40ea4-95f1-47b0-9c83-cf7621c15542	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 12:25:27.919122+00	
00000000-0000-0000-0000-000000000000	c665d200-e396-472c-99b0-4b7fc02bd29c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 12:37:55.202002+00	
00000000-0000-0000-0000-000000000000	e599658a-cc67-4861-a0ca-f7096dc6c5f9	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-14 13:44:18.616722+00	
00000000-0000-0000-0000-000000000000	f2e9fff1-5bf5-41c6-8144-bd2dd78e39ef	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-15 07:26:14.045833+00	
00000000-0000-0000-0000-000000000000	ac9345dc-27a1-43ad-9e83-977e7ee7b15e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-15 07:30:36.511488+00	
00000000-0000-0000-0000-000000000000	3588d217-0308-414e-8d2e-5ee65082ef23	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-15 08:38:36.549616+00	
00000000-0000-0000-0000-000000000000	c5c8c465-b6fc-4ab6-a121-1a6c778696a9	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-15 09:39:22.248272+00	
00000000-0000-0000-0000-000000000000	90368a06-1ba7-47c4-a037-adb8598b3b9c	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-15 11:48:50.807585+00	
00000000-0000-0000-0000-000000000000	1c537e90-7c3e-4aea-9fd6-22d7599b7aa5	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-16 09:29:55.873878+00	
00000000-0000-0000-0000-000000000000	5175b50c-10e4-4f28-ae52-9fd38f6de9eb	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-16 11:39:57.489632+00	
00000000-0000-0000-0000-000000000000	24031fcd-2f5d-410b-88f7-615aad093a31	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-16 12:49:40.822968+00	
00000000-0000-0000-0000-000000000000	6d223039-599f-4177-884d-82e76f2697ce	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-09-16 14:11:36.310949+00	
00000000-0000-0000-0000-000000000000	f5525080-12ac-4a5a-80e8-319f1c81d25a	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-19 06:15:10.74912+00	
00000000-0000-0000-0000-000000000000	85d9b11f-092d-4017-8c5a-a1cf496df52b	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-19 07:15:39.772074+00	
00000000-0000-0000-0000-000000000000	fb724606-53c7-4128-a87d-bdaac676d4db	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-19 07:16:09.996625+00	
00000000-0000-0000-0000-000000000000	e0c8508d-8d48-42e3-aa25-fd1f65739063	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-19 08:45:21.276325+00	
00000000-0000-0000-0000-000000000000	a3b791b9-7092-48aa-ab7c-8d1afe203f99	{"action":"user_recovery_requested","actor_id":"704d43de-7fd6-48b2-bbac-ff661132144e","actor_username":"alain.morard@swisstopo.ch","log_type":"user"}	2023-09-19 08:48:17.127306+00	
00000000-0000-0000-0000-000000000000	bcebde9c-c6e0-4e6b-ba37-008646cc0606	{"action":"user_signedup","actor_id":"704d43de-7fd6-48b2-bbac-ff661132144e","actor_username":"alain.morard@swisstopo.ch","log_type":"team"}	2023-09-19 08:48:37.69746+00	
00000000-0000-0000-0000-000000000000	d5e8426c-1d5b-4b76-9cca-1203f5944cfd	{"action":"user_modified","actor_id":"704d43de-7fd6-48b2-bbac-ff661132144e","actor_username":"alain.morard@swisstopo.ch","log_type":"user"}	2023-09-19 08:48:44.869604+00	
00000000-0000-0000-0000-000000000000	67830387-ccd7-4bb3-8bd9-9cc9815521ff	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-19 09:59:56.773046+00	
00000000-0000-0000-0000-000000000000	864d9b19-9d82-4519-a73d-9a23fabd1bc9	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-19 11:26:13.467853+00	
00000000-0000-0000-0000-000000000000	509e3975-a8c7-46fa-a22c-c990027b631e	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-19 12:26:59.754204+00	
00000000-0000-0000-0000-000000000000	88ffbbde-290f-4dd2-a325-44ff47be25c8	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-19 12:54:27.226093+00	
00000000-0000-0000-0000-000000000000	f84b62a4-30b6-4649-9175-0cdbdbfc5053	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 07:38:15.80853+00	
00000000-0000-0000-0000-000000000000	7ef70f76-900e-493f-8283-cf3a574784ea	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 07:39:15.36276+00	
00000000-0000-0000-0000-000000000000	ab394d12-1127-4558-82bc-5b3e1ffba4c8	{"action":"login","actor_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","actor_username":"wayne.maurer@lambda-it.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 07:41:23.625657+00	
00000000-0000-0000-0000-000000000000	411acf78-0261-4838-8d3c-c7c8004be574	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 12:46:27.765964+00	
00000000-0000-0000-0000-000000000000	c2b78c1c-6062-4cb1-86da-8dc32e7804e7	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 13:54:20.020107+00	
00000000-0000-0000-0000-000000000000	ad65a9ca-ce62-4a72-a028-a68a9f7b40be	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 14:02:05.756661+00	
00000000-0000-0000-0000-000000000000	1f74548b-03b0-4f70-ad86-ae3e2f4bde89	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-20 15:11:03.9637+00	
00000000-0000-0000-0000-000000000000	f6ff36e6-a772-4533-9520-5120d6206522	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-21 12:50:02.676091+00	
00000000-0000-0000-0000-000000000000	98103c7f-8150-44cf-b2ef-5b8c1c2678f3	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-21 13:04:23.5376+00	
00000000-0000-0000-0000-000000000000	1d5cde0e-f78d-4340-999f-c67029fa84a0	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-25 08:54:18.552214+00	
00000000-0000-0000-0000-000000000000	50c658b7-ff92-40f0-b263-093256bad205	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-26 06:21:23.093378+00	
00000000-0000-0000-0000-000000000000	0d38be0c-048b-485c-90e8-7f567f0d5a13	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-26 07:22:09.608662+00	
00000000-0000-0000-0000-000000000000	83baf11f-47d7-448b-ad2b-6dad3d317e8e	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-26 08:24:03.573257+00	
00000000-0000-0000-0000-000000000000	dee90aed-ddf7-4797-80bd-af90a21ce2d5	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-26 09:24:38.486121+00	
00000000-0000-0000-0000-000000000000	464d482d-ab03-4d60-85ee-eea7fcfc18bd	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-26 10:00:48.972987+00	
00000000-0000-0000-0000-000000000000	84dd4785-2db0-4e17-9558-a8ed3a657326	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 06:15:26.632191+00	
00000000-0000-0000-0000-000000000000	0e5968af-34ce-41bb-a233-e10157442869	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 06:16:07.390034+00	
00000000-0000-0000-0000-000000000000	3947c91a-fb0f-431c-98b6-c1a7f2a10e06	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 07:19:22.485144+00	
00000000-0000-0000-0000-000000000000	6f5a3c0d-ed40-4f8e-91bb-8878d35f7c66	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 07:30:41.132728+00	
00000000-0000-0000-0000-000000000000	84dfb9c5-3cb9-4f32-90a5-8d206e7cb0ee	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 08:22:17.295118+00	
00000000-0000-0000-0000-000000000000	d3d6e238-a3fb-4d97-a3b9-2b68db19caf3	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 09:22:53.822714+00	
00000000-0000-0000-0000-000000000000	80af4480-9d15-48cd-9935-4bbb579d69d2	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 10:26:09.584595+00	
00000000-0000-0000-0000-000000000000	e86aaf64-e39f-4bda-8b79-307e21b5fb05	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 11:58:05.777991+00	
00000000-0000-0000-0000-000000000000	3ddafd8b-cfb5-43fd-b06c-847fbd5a57c5	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-09-27 12:00:29.780169+00	
00000000-0000-0000-0000-000000000000	e01623f2-7dc1-4eef-a1bf-181914f43ab8	{"action":"login","actor_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","actor_username":"robin.allenbach@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-27 12:25:55.254515+00	
00000000-0000-0000-0000-000000000000	a9a55cde-bd18-48da-849c-ea0f522628c5	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-28 11:40:24.042478+00	
00000000-0000-0000-0000-000000000000	ad03458d-2e92-405b-b92e-c6baadd70417	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-09-29 04:39:11.611482+00	
00000000-0000-0000-0000-000000000000	c7b68973-38e0-451a-8474-380da8b6e607	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-02 11:57:23.166038+00	
00000000-0000-0000-0000-000000000000	e9374dcd-5c11-4cdb-90ab-3813c667f73a	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"anina.ursprung@swisstopo.ch","user_id":"29848f76-e923-4b33-9ed1-a76961bef372","user_phone":""}}	2023-10-02 11:59:24.140721+00	
00000000-0000-0000-0000-000000000000	bb6d4083-b3b3-40fc-83a7-26fd6d57ab8a	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"anina.ursprung@swisstopo.ch","user_id":"b1cc6265-a789-46c0-ba9f-dd2ad47e878d"}}	2023-10-02 11:59:41.184759+00	
00000000-0000-0000-0000-000000000000	214c65a1-54e0-4b36-a36a-f81f45f7166f	{"action":"user_signedup","actor_id":"b1cc6265-a789-46c0-ba9f-dd2ad47e878d","actor_username":"anina.ursprung@swisstopo.ch","log_type":"team"}	2023-10-02 12:08:09.745687+00	
00000000-0000-0000-0000-000000000000	c499dd12-060b-460a-8f12-e61c58be5adf	{"action":"user_modified","actor_id":"b1cc6265-a789-46c0-ba9f-dd2ad47e878d","actor_username":"anina.ursprung@swisstopo.ch","log_type":"user"}	2023-10-02 12:08:21.715024+00	
00000000-0000-0000-0000-000000000000	c7d603e5-f9b1-4f2c-9972-f19fa8d37c54	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 08:24:46.602946+00	
00000000-0000-0000-0000-000000000000	8996aeb6-b4db-48d3-bd1b-a4ea0c27ffa2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 08:44:34.078818+00	
00000000-0000-0000-0000-000000000000	a9507e70-dcb0-4eb7-87e2-84a3fde32801	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 09:27:26.072329+00	
00000000-0000-0000-0000-000000000000	1af8f460-c63c-4c87-bf16-fb97a546948f	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-02-13 12:43:48.702702+00	
00000000-0000-0000-0000-000000000000	22047ac7-d943-4984-98e6-d4054b941d7e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 09:49:22.056408+00	
00000000-0000-0000-0000-000000000000	6d4a0348-684b-44e4-8621-5381f5ec536e	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"laurent.thum@swisstopo.ch","user_id":"d128758c-c2ea-406d-99f8-4568706ba91e"}}	2023-10-03 10:13:47.595413+00	
00000000-0000-0000-0000-000000000000	8f116687-ce19-46a0-9729-964376258df5	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 12:00:42.857242+00	
00000000-0000-0000-0000-000000000000	638e463a-4360-4316-bc30-4ce664957f1c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 12:37:39.965142+00	
00000000-0000-0000-0000-000000000000	38eb5590-a7fa-4cb6-a6a0-0c40f76cf0f9	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-03 13:02:30.945257+00	
00000000-0000-0000-0000-000000000000	c7b4abe9-0ae9-4b29-9840-5f4737e40867	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-10-03 13:52:49.890295+00	
00000000-0000-0000-0000-000000000000	903895fb-1e6f-4437-90f2-a57cba73b886	{"action":"user_signedup","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"team"}	2023-10-03 13:55:09.821486+00	
00000000-0000-0000-0000-000000000000	238c4830-6312-4352-8881-54a33f1f51fb	{"action":"user_modified","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"user"}	2023-10-03 13:55:20.257301+00	
00000000-0000-0000-0000-000000000000	178bde21-a5ab-4bab-8261-7025e958f403	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-04 07:17:01.456355+00	
00000000-0000-0000-0000-000000000000	ea87257d-9ee8-4327-bbe9-9065b483986c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-04 07:30:09.874657+00	
00000000-0000-0000-0000-000000000000	0116d340-d9fc-4d1b-b00e-63659f56c422	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-04 07:30:20.455061+00	
00000000-0000-0000-0000-000000000000	60295e1c-af5f-4935-9d7d-c0d11dd0ffcd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-04 08:31:58.206809+00	
00000000-0000-0000-0000-000000000000	065c4dcc-a760-47f4-ba4d-1cb50f575adc	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-04 09:16:06.266774+00	
00000000-0000-0000-0000-000000000000	8e9c3671-03f8-47ee-9e64-388cd5293cec	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-04 10:15:44.696063+00	
00000000-0000-0000-0000-000000000000	c7ff6fc5-8c9a-4a8d-90d3-97e12e789fa5	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 06:15:31.250547+00	
00000000-0000-0000-0000-000000000000	71f2b7eb-3893-411f-82e9-91ec170cdb0c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 06:27:55.572614+00	
00000000-0000-0000-0000-000000000000	6c83e06c-b983-4a3e-ab6f-90837e6f7a66	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 07:29:57.342256+00	
00000000-0000-0000-0000-000000000000	5480acd7-0fb4-4785-a901-a903669d42f3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 08:30:27.089886+00	
00000000-0000-0000-0000-000000000000	40539eb1-e466-436c-a9d1-69d6de72f720	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 11:23:05.094894+00	
00000000-0000-0000-0000-000000000000	feec2436-07fc-4f8b-9527-52415975895a	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 12:24:56.874496+00	
00000000-0000-0000-0000-000000000000	10c65957-5d6d-42ca-841a-79d28bc29fea	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 13:28:10.136404+00	
00000000-0000-0000-0000-000000000000	6cf2e2fa-faa0-4374-abeb-5fdacc3df104	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-05 14:28:37.507233+00	
00000000-0000-0000-0000-000000000000	dd2b6812-d0cf-49da-9fba-525d42831633	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-06 06:05:44.37374+00	
00000000-0000-0000-0000-000000000000	b8e2f46f-1ad4-4a05-a5eb-ec96e36abe3b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-06 09:44:10.398717+00	
00000000-0000-0000-0000-000000000000	7633dbf4-a6f8-4047-8ebe-6fb62024ae41	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-06 11:19:54.443294+00	
00000000-0000-0000-0000-000000000000	39fbc3bf-361b-481d-ae2b-1f0d2a9e893b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-09 06:36:14.615301+00	
00000000-0000-0000-0000-000000000000	aa8dea6e-6acd-4694-bf8c-5ccdc98f5c38	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-09 11:26:54.763337+00	
00000000-0000-0000-0000-000000000000	ce2df052-f61a-4589-a5e4-3e8e0112bb88	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-09 12:31:55.175255+00	
00000000-0000-0000-0000-000000000000	0fc8dd95-81b9-4b92-b278-46438293da75	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-09 14:04:31.66725+00	
00000000-0000-0000-0000-000000000000	98778705-b609-492e-ab94-83dd2a9c71ce	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-09 15:04:38.730038+00	
00000000-0000-0000-0000-000000000000	c6b71cc2-a780-4e0a-8f15-8a4bd117837d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-09 15:26:00.178274+00	
00000000-0000-0000-0000-000000000000	be393243-2fb2-4b4a-a3a3-5e142ecf9726	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-09 15:29:55.885019+00	
00000000-0000-0000-0000-000000000000	44544f3d-071d-4ce3-af0d-784b76c30492	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-10 06:36:16.60478+00	
00000000-0000-0000-0000-000000000000	b70e9e66-c1b6-4689-aff2-f5b6d556dec7	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-11 05:47:03.270476+00	
00000000-0000-0000-0000-000000000000	9ca67249-55eb-4d99-9833-7f47ff571681	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-11 06:54:14.7677+00	
00000000-0000-0000-0000-000000000000	617ba574-f138-486f-9547-7e36a0e0509a	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-11 08:03:15.292668+00	
00000000-0000-0000-0000-000000000000	eb6438f9-8842-409f-8df5-7cec71d87787	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-11 09:06:39.670485+00	
00000000-0000-0000-0000-000000000000	a5589cf0-771c-4dac-8422-0ec6095419d2	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-10-11 09:07:13.267017+00	
00000000-0000-0000-0000-000000000000	2a3c0b86-2200-4a00-abb5-e844abf9a531	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 05:58:22.676785+00	
00000000-0000-0000-0000-000000000000	f94d7312-a8cb-45f1-b685-0f3135945fc5	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-12 07:30:47.255733+00	
00000000-0000-0000-0000-000000000000	1758efec-3b24-4776-ac9d-5582d4d47c44	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-12 08:45:52.627141+00	
00000000-0000-0000-0000-000000000000	23819985-1102-4e1f-8003-cd42fc49dae0	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 08:54:34.62844+00	
00000000-0000-0000-0000-000000000000	1e098ed7-417d-4a90-9f89-c1f339433431	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-12 09:47:43.051393+00	
00000000-0000-0000-0000-000000000000	08866303-9723-4913-995e-9152bbf6a570	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 12:03:53.959782+00	
00000000-0000-0000-0000-000000000000	270dff41-676a-47ba-82ca-394cd5372b02	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 12:18:41.372858+00	
00000000-0000-0000-0000-000000000000	9b8a2c10-28fa-480d-ba1a-cdabfd2707e0	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 13:00:25.083552+00	
00000000-0000-0000-0000-000000000000	9d9f3b37-87af-4b13-9252-75b336bf168d	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-10-12 13:03:18.026513+00	
00000000-0000-0000-0000-000000000000	6b34d2d3-5cc9-40d7-a24a-a98d4fdd769d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 13:23:13.877715+00	
00000000-0000-0000-0000-000000000000	ae98cad2-adf2-4bb5-9020-b994c5963ed5	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 14:20:59.090967+00	
00000000-0000-0000-0000-000000000000	96ec69c2-e178-468f-a361-63a715eb6d62	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-12 14:26:20.402592+00	
00000000-0000-0000-0000-000000000000	0a55f348-f633-439c-9a85-d84be84f65cb	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-12 14:57:09.648871+00	
00000000-0000-0000-0000-000000000000	309e4989-6417-4968-aa45-f70c48ed862f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-13 05:57:46.455014+00	
00000000-0000-0000-0000-000000000000	6461fb1a-06da-498d-bb20-60e33dbf2e24	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-14 09:32:00.771597+00	
00000000-0000-0000-0000-000000000000	1f7d30ff-6ce8-4e75-93e0-1d9f106ea6c8	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-14 10:37:58.50261+00	
00000000-0000-0000-0000-000000000000	1bb28d88-9a5f-48aa-8982-a06ab6718458	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-14 11:43:37.736304+00	
00000000-0000-0000-0000-000000000000	6eabd7dd-d715-494d-95b0-f734d2eed7b7	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-14 12:52:41.413668+00	
00000000-0000-0000-0000-000000000000	ffe58353-46ac-4250-b029-a4b5d9d21430	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-14 13:52:47.64299+00	
00000000-0000-0000-0000-000000000000	b13b6e71-2075-4288-a6af-ff2d32424acc	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-14 17:37:41.827838+00	
00000000-0000-0000-0000-000000000000	e8818e77-0032-41ac-b648-17767d23dce0	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-16 06:02:25.771983+00	
00000000-0000-0000-0000-000000000000	86c54966-c679-4571-b4ef-e2e351e0410b	{"action":"login","actor_id":"3ddc99b1-a269-49a8-a693-c0fd68d39a20","actor_username":"stephan.dallagnolo@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-16 07:09:03.512368+00	
00000000-0000-0000-0000-000000000000	dead2381-eb4f-47fd-bc53-84bdb651d2f0	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 05:52:07.655139+00	
00000000-0000-0000-0000-000000000000	8219b803-fe44-4c84-a06e-775678dcb1ca	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 06:13:14.943589+00	
00000000-0000-0000-0000-000000000000	a82f02d0-6e92-473e-ac29-84bd09e7b74b	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 06:58:02.532848+00	
00000000-0000-0000-0000-000000000000	afb04bee-2de6-43b8-b5fa-b2a5aec19adc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 07:13:41.562426+00	
00000000-0000-0000-0000-000000000000	3bd79a09-bc5a-45e0-97ab-8c2e36c1c01f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 07:58:41.025351+00	
00000000-0000-0000-0000-000000000000	60cb5d20-89da-406b-821d-669558471d47	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 08:53:40.818528+00	
00000000-0000-0000-0000-000000000000	e1391240-83cf-4aba-b934-554c9ccea9bf	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 09:10:21.248858+00	
00000000-0000-0000-0000-000000000000	30f972e0-a02e-4c09-9edd-af78381d2587	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-10-17 09:57:19.075391+00	
00000000-0000-0000-0000-000000000000	8eec9bb7-57f3-4c35-9d40-c90fa383183e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 11:12:26.95068+00	
00000000-0000-0000-0000-000000000000	5e4ead25-3242-422f-be3c-b31335a8679e	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 12:10:25.175896+00	
00000000-0000-0000-0000-000000000000	3335d82d-2de1-417f-b1c3-1a35ec238f4f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 12:14:30.419484+00	
00000000-0000-0000-0000-000000000000	fa853f33-566b-4707-b704-6772a859b19e	{"action":"login","actor_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","actor_username":"robin.allenbach@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 12:45:47.953124+00	
00000000-0000-0000-0000-000000000000	3418254b-28c1-415b-8fe9-c27a58ab2d1d	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 13:11:35.631038+00	
00000000-0000-0000-0000-000000000000	3ba71ff8-6763-455d-806a-d09b1dfdb48e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 13:32:47.54724+00	
00000000-0000-0000-0000-000000000000	11023f46-2462-4c61-b13c-9b32b73cd2b1	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-10-17 13:46:52.429654+00	
00000000-0000-0000-0000-000000000000	d887c214-63de-445f-b115-e39b2c225f93	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-17 14:33:35.488622+00	
00000000-0000-0000-0000-000000000000	dbb22e1f-f9ff-4146-bbc9-2bfa2b122e4d	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-17 15:32:16.892494+00	
00000000-0000-0000-0000-000000000000	d4a35520-4661-432b-a847-dd2b67a911b6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-18 06:01:37.516049+00	
00000000-0000-0000-0000-000000000000	f3e4a8c5-b0e6-43e0-84e7-6b8fea604d47	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-18 12:19:13.177495+00	
00000000-0000-0000-0000-000000000000	f682260e-5238-4bc5-afe8-71264985cb7b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-18 14:01:45.727448+00	
00000000-0000-0000-0000-000000000000	9eaa34d1-f19d-4422-be3a-853d82565962	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-18 15:14:22.319884+00	
00000000-0000-0000-0000-000000000000	9f5abc2e-28e8-4ac0-8238-12976d9d8cd9	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-18 15:22:40.821267+00	
00000000-0000-0000-0000-000000000000	3e20ad40-1140-4ec5-9971-9811cadcaed8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-19 06:15:13.967419+00	
00000000-0000-0000-0000-000000000000	9b5c1394-dadb-4cdb-9fe4-3c3ed6016814	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-19 13:43:29.218745+00	
00000000-0000-0000-0000-000000000000	b491f1c9-cc15-4b49-9788-20c9e6298fb2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-20 06:38:14.566181+00	
00000000-0000-0000-0000-000000000000	644d1aba-a2e8-4ddd-b710-67b19bea0e63	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-20 12:28:43.506431+00	
00000000-0000-0000-0000-000000000000	9fb2cf9c-55c6-49e3-af8e-52f7fd93bb17	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-20 13:31:15.39748+00	
00000000-0000-0000-0000-000000000000	ccca0737-8fe7-4dd4-8119-965db61f6ab1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-20 14:35:35.685953+00	
00000000-0000-0000-0000-000000000000	4b8c0966-5cf4-401e-99ec-420001288127	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-21 08:26:25.586287+00	
00000000-0000-0000-0000-000000000000	1b3b1b80-8017-4a13-a96b-424404f4e26a	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-21 08:39:51.253268+00	
00000000-0000-0000-0000-000000000000	edf8ae9b-7f71-416e-859b-618d61630fbb	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-21 11:58:23.118773+00	
00000000-0000-0000-0000-000000000000	a5f1a43f-eab7-4dc5-a0ed-0c34e96a0235	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-21 13:01:07.164615+00	
00000000-0000-0000-0000-000000000000	f104a6c8-2c24-47b3-ab2a-3a6f8b5138cd	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-22 08:15:16.27791+00	
00000000-0000-0000-0000-000000000000	79edc433-abe9-48de-8367-34c15dc55fe3	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-10-22 09:16:26.662508+00	
00000000-0000-0000-0000-000000000000	174c1465-b42a-4317-97a9-ff80b8418273	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-23 06:02:19.195582+00	
00000000-0000-0000-0000-000000000000	b7eb8487-3fe4-40a1-96d6-d05a4b8c66ba	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-23 07:06:36.386168+00	
00000000-0000-0000-0000-000000000000	28ee40ca-3c34-4f71-96b2-54b846fb3ed6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-23 09:11:03.767232+00	
00000000-0000-0000-0000-000000000000	6dd01963-f133-4edf-98cb-47e66542e6df	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-23 09:38:48.698679+00	
00000000-0000-0000-0000-000000000000	2d150b1d-d793-48f7-950b-8c63d843bbe2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 06:19:46.953685+00	
00000000-0000-0000-0000-000000000000	0b11f074-9e87-4226-9d47-4d717a3936ed	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 07:10:57.542752+00	
00000000-0000-0000-0000-000000000000	9bff1484-c3e0-4490-94c6-e36d9e99ef9a	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 07:12:09.821944+00	
00000000-0000-0000-0000-000000000000	d935a8b2-cc66-4ddd-bad0-d0fc7ace6aba	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 08:33:14.839955+00	
00000000-0000-0000-0000-000000000000	9da8e71b-ab7a-424d-8f81-9ccafe885eb6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 09:39:56.90314+00	
00000000-0000-0000-0000-000000000000	cdbf6ec1-7c25-47cb-9be7-4f9b037101db	{"action":"user_recovery_requested","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"user"}	2023-10-24 09:43:49.038667+00	
00000000-0000-0000-0000-000000000000	d2c6b1a2-8b47-4f65-b351-fafc18e33e3c	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account"}	2023-10-24 09:44:03.883673+00	
00000000-0000-0000-0000-000000000000	6c398c83-be8d-419d-a605-d88e2d6e19c0	{"action":"user_modified","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"user"}	2023-10-24 09:44:11.345176+00	
00000000-0000-0000-0000-000000000000	373073d0-39a5-4cb5-a12c-692ebc9ce4dd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 12:05:20.086623+00	
00000000-0000-0000-0000-000000000000	1c1e3cd9-5a72-4c41-9748-7f03c1c2b328	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-24 14:12:00.475605+00	
00000000-0000-0000-0000-000000000000	58135ae3-0098-43ee-bb33-907b1b065e53	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-25 06:33:11.624964+00	
00000000-0000-0000-0000-000000000000	ef3baec3-b3f7-4f7d-838f-bd94ee3e2448	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 05:59:33.899075+00	
00000000-0000-0000-0000-000000000000	3d375485-75c9-4209-a313-9a3f18b915a4	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 11:26:28.642358+00	
00000000-0000-0000-0000-000000000000	602bd487-0f84-4871-9a54-eba4d417adbb	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 11:35:02.880299+00	
00000000-0000-0000-0000-000000000000	ec598382-9d27-4d2f-8a29-ef5221d7b6ae	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 12:13:31.767862+00	
00000000-0000-0000-0000-000000000000	9c645936-69d5-4ec7-94ba-c6ce62b2a983	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 12:41:53.242932+00	
00000000-0000-0000-0000-000000000000	d85ba410-a223-43a7-b4a2-0f3a10c390ae	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 13:55:32.425555+00	
00000000-0000-0000-0000-000000000000	710d8c67-0d82-439e-b6f4-79fef5cd68a3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 13:56:18.405182+00	
00000000-0000-0000-0000-000000000000	df800da1-2b83-4235-94dd-634b7fb9a1fe	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-26 14:57:13.351465+00	
00000000-0000-0000-0000-000000000000	2979d634-4066-4353-b5f0-233475a30950	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-26 15:13:23.698253+00	
00000000-0000-0000-0000-000000000000	2ab2b60e-440d-464f-9f03-173e9aebbde3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-27 06:26:37.757194+00	
00000000-0000-0000-0000-000000000000	471f68bc-8575-4756-b2a9-deb64c9a6480	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-27 08:03:11.788915+00	
00000000-0000-0000-0000-000000000000	c2f8f958-2572-4724-8eb3-2ac6f9ca2f06	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-27 09:04:12.016345+00	
00000000-0000-0000-0000-000000000000	f3826511-50e2-4a92-99ca-2cb163f71555	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-27 14:32:36.821216+00	
00000000-0000-0000-0000-000000000000	fc353c54-15f5-467e-87e7-8957da5fd313	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-27 15:15:25.594568+00	
00000000-0000-0000-0000-000000000000	8b0f636b-7326-4e1b-96f7-ef76b7eaca72	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-27 15:25:11.656111+00	
00000000-0000-0000-0000-000000000000	d9863863-bb48-41f5-993d-5fe3ab56385c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-30 08:06:35.478712+00	
00000000-0000-0000-0000-000000000000	8255ae98-d3d1-4ce6-9b92-3a341a0a8323	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-30 12:16:28.651353+00	
00000000-0000-0000-0000-000000000000	8150600c-0918-4802-9f2a-8b2b68683add	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-30 13:34:37.363343+00	
00000000-0000-0000-0000-000000000000	d8a3be1a-a54d-4fba-9b41-68ddb90643bc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-30 13:41:37.103865+00	
00000000-0000-0000-0000-000000000000	054b5524-a2f9-4092-a4e5-9de13ed4a000	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-30 14:45:45.142588+00	
00000000-0000-0000-0000-000000000000	bb6a5b4c-8f95-4e95-a573-08d6430c1e52	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-30 15:47:58.316856+00	
00000000-0000-0000-0000-000000000000	bd5f712e-0240-4995-90c5-45cb2f658e7f	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-30 16:29:12.628244+00	
00000000-0000-0000-0000-000000000000	f89e9178-1cc4-48ac-8bbf-c7098d132992	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-31 09:24:57.323209+00	
00000000-0000-0000-0000-000000000000	6e8978d6-7a7b-428d-962e-43132ec7cfd5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-31 13:00:11.372668+00	
00000000-0000-0000-0000-000000000000	a7a87f31-ac5b-4fcc-917a-59a7b60c95fd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-31 14:02:39.42126+00	
00000000-0000-0000-0000-000000000000	fa33cc29-4ffc-4bf5-9b0e-8533afbd84df	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-31 15:08:24.694437+00	
00000000-0000-0000-0000-000000000000	822a8425-a8e6-4377-84c0-17eeef67eecb	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-10-31 16:12:19.230835+00	
00000000-0000-0000-0000-000000000000	7bfa05f1-5311-4fcd-a936-4739916ce04a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-10-31 16:49:05.174804+00	
00000000-0000-0000-0000-000000000000	019dccf6-2281-4055-981c-6163cbab0912	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-01 12:51:46.746208+00	
00000000-0000-0000-0000-000000000000	147c6f7c-e3d6-49c5-957f-3d843fdab76c	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-01 13:51:52.407146+00	
00000000-0000-0000-0000-000000000000	5045d643-bd32-4a0c-958a-e7e7a6c8d6cc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-01 14:43:48.914868+00	
00000000-0000-0000-0000-000000000000	e9711917-2de7-412a-8697-394d53ccf170	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-01 15:49:11.189704+00	
00000000-0000-0000-0000-000000000000	cfcda17a-04ea-4e37-9f0e-6dc6ee11ad3a	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-11-01 16:13:58.399191+00	
00000000-0000-0000-0000-000000000000	6426cc8e-e0ec-40f0-9b10-de6a6630ca13	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 07:42:00.60819+00	
00000000-0000-0000-0000-000000000000	c62052d8-900b-4f55-893d-147b36b61e97	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 12:29:22.646706+00	
00000000-0000-0000-0000-000000000000	795208c1-7876-49c9-ac14-3951d5148988	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 13:27:58.082192+00	
00000000-0000-0000-0000-000000000000	fcd41ebb-ef31-4d40-bc87-44c538c32462	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 13:41:12.955495+00	
00000000-0000-0000-0000-000000000000	476ef415-dca4-4602-a8b2-c66de74fe7d0	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 13:59:16.35546+00	
00000000-0000-0000-0000-000000000000	18b9faf1-fd48-41f2-96c5-e493b0f2863a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 14:43:52.872743+00	
00000000-0000-0000-0000-000000000000	7371c5bb-60e9-4c4d-9534-83f880e03770	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 15:04:26.119338+00	
00000000-0000-0000-0000-000000000000	3edd153e-bc94-4c9a-873a-f655ef9ee6ca	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-02 15:04:33.635939+00	
00000000-0000-0000-0000-000000000000	1db62db6-cb23-4967-8633-51a42dbe4f52	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-03 07:21:47.267218+00	
00000000-0000-0000-0000-000000000000	7d71bbe4-828c-4b0e-8c1e-5979ee9690a2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-03 08:31:01.278945+00	
00000000-0000-0000-0000-000000000000	79fb54d1-52e0-46cf-aff1-eedc29b93435	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-03 09:02:01.718334+00	
00000000-0000-0000-0000-000000000000	04a65787-8756-4a2d-9315-a2cca095b775	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-03 09:32:49.01721+00	
00000000-0000-0000-0000-000000000000	5f5c1a03-44b3-4dc1-be27-86d73ba640b7	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-03 13:27:52.754859+00	
00000000-0000-0000-0000-000000000000	8d67e5ad-a0f7-42d3-a1f7-cd8dcb96c94a	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-11-03 13:36:09.78162+00	
00000000-0000-0000-0000-000000000000	7f8ab39c-80df-4019-9029-9298a2f70c8c	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-04 10:16:47.480192+00	
00000000-0000-0000-0000-000000000000	ab284799-ce9e-454e-8835-b2f87dd56f24	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-04 11:25:11.496281+00	
00000000-0000-0000-0000-000000000000	c9b10488-1cac-439c-8d59-b6d66e002169	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-04 12:20:53.523637+00	
00000000-0000-0000-0000-000000000000	71938e5a-6fd9-4b46-82f1-577892ee8e6e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-04 13:21:03.72569+00	
00000000-0000-0000-0000-000000000000	fb847ffd-0a80-4527-8c9b-2faeb820ae70	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-05 09:54:35.473296+00	
00000000-0000-0000-0000-000000000000	4c313021-cf8a-45f4-82d3-34edd47a194d	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-05 10:54:43.756502+00	
00000000-0000-0000-0000-000000000000	c42ebb22-148f-4da4-8544-fadb5c4a0ebc	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-05 13:09:31.290043+00	
00000000-0000-0000-0000-000000000000	2b2f56a6-8454-4591-a880-4076ade38a30	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 07:31:39.231216+00	
00000000-0000-0000-0000-000000000000	59669068-4360-406a-864c-8b9f71a752d3	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 07:59:03.851281+00	
00000000-0000-0000-0000-000000000000	b878872a-5dcb-4659-8b85-5004cd939627	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 09:18:11.253595+00	
00000000-0000-0000-0000-000000000000	9d84833d-c439-488a-9195-98b29ab67366	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 10:23:34.832415+00	
00000000-0000-0000-0000-000000000000	b95ef554-ae25-4452-b3d8-847b4299bc43	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 11:26:29.778076+00	
00000000-0000-0000-0000-000000000000	7a54b77c-84c9-4bd4-9b5b-de66752ed089	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 12:31:17.639666+00	
00000000-0000-0000-0000-000000000000	ba064bea-eb83-41eb-b386-c9867490a4fa	{"action":"login","actor_id":"704d43de-7fd6-48b2-bbac-ff661132144e","actor_username":"alain.morard@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 13:14:29.302257+00	
00000000-0000-0000-0000-000000000000	c51d37a6-71df-4e10-bb1e-95f185c2f26c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 14:20:43.021989+00	
00000000-0000-0000-0000-000000000000	79009638-53e5-4a89-a37b-dc2edfabec07	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 15:25:00.145191+00	
00000000-0000-0000-0000-000000000000	eabc20f1-1604-4526-9769-97f708ba2c30	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-06 16:25:09.294167+00	
00000000-0000-0000-0000-000000000000	49c9e168-3af9-4b13-876d-194c4e4dd925	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-11-06 16:43:16.304807+00	
00000000-0000-0000-0000-000000000000	3975df46-6581-46df-8f09-26ba03067852	{"action":"login","actor_id":"9568c612-a0b9-44c5-8836-513234d53409","actor_username":"michael.gysi@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 06:01:58.730347+00	
00000000-0000-0000-0000-000000000000	f4e9543a-1a17-4b43-b12d-3b2783f9c34b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 06:59:45.873393+00	
00000000-0000-0000-0000-000000000000	3f6020ad-9911-4c58-8fdb-3de5e672bab7	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 07:40:47.957334+00	
00000000-0000-0000-0000-000000000000	547fa833-35d8-461a-8b35-2077543f61e6	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 08:44:10.994697+00	
00000000-0000-0000-0000-000000000000	16baf249-a93d-417b-9864-703918939702	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 09:45:46.277099+00	
00000000-0000-0000-0000-000000000000	0aa465a7-55f2-4c59-acec-034d076193b3	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-11-07 10:33:12.385551+00	
00000000-0000-0000-0000-000000000000	a3190e8b-818b-4819-b191-6552a351fa6e	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 11:53:48.354215+00	
00000000-0000-0000-0000-000000000000	77783a01-42b6-4036-89c5-220418d50c45	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-11-07 12:26:24.056592+00	
00000000-0000-0000-0000-000000000000	79e11ad3-9e6e-4f26-b725-5eaceb2db8bd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 12:39:43.680563+00	
00000000-0000-0000-0000-000000000000	83d14068-8f5e-456a-b411-219c3b71b238	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-07 13:42:14.505545+00	
00000000-0000-0000-0000-000000000000	ae1b3ff0-3f6e-4b68-ae9f-3e21a6a9b5ff	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-08 06:58:42.850138+00	
00000000-0000-0000-0000-000000000000	4c3039a9-b77b-49df-af37-b33c75ea21b8	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-11-08 06:59:41.401494+00	
00000000-0000-0000-0000-000000000000	cb07dd69-4e34-4478-9418-1eb5d5cbb543	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-08 06:59:45.720572+00	
00000000-0000-0000-0000-000000000000	99aad969-e8db-4900-abd7-2a4d451fc02f	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-08 15:51:55.346595+00	
00000000-0000-0000-0000-000000000000	77fdb3c2-3ead-4cc2-ab19-d7967f9528ff	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-08 18:44:42.185122+00	
00000000-0000-0000-0000-000000000000	85f2eb0a-5215-4f99-a865-3d8563a053f7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-09 07:17:41.513759+00	
00000000-0000-0000-0000-000000000000	a1747f23-c0b3-41e0-9a58-ce93a952daca	{"action":"login","actor_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","actor_username":"robin.allenbach@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-09 09:54:46.668623+00	
00000000-0000-0000-0000-000000000000	78a3a955-d74d-47c8-bca7-500ec9020b7f	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-09 10:57:55.681116+00	
00000000-0000-0000-0000-000000000000	dc8cbaa3-3a81-40a3-b523-db6820f31e8d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-09 12:02:03.587989+00	
00000000-0000-0000-0000-000000000000	3389e70f-daef-4f83-943d-d57777dbf2cd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-09 13:30:05.324853+00	
00000000-0000-0000-0000-000000000000	052c52b5-a723-42e1-a903-1573554b53c3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-10 07:23:40.903398+00	
00000000-0000-0000-0000-000000000000	746a25d2-e6d1-4788-8c70-f0ef268c2bbb	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-10 09:30:11.653843+00	
00000000-0000-0000-0000-000000000000	48a2e29c-fc05-48a7-bf40-4703cbcc6d7b	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-10 10:52:17.195524+00	
00000000-0000-0000-0000-000000000000	498cb5aa-c985-4cda-af22-bc5b470137e5	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-10 12:06:55.043389+00	
00000000-0000-0000-0000-000000000000	7864fca2-cb62-4532-86ca-1745a13d2e82	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-11 08:26:29.746317+00	
00000000-0000-0000-0000-000000000000	09ed1cc1-a8d2-4ecd-930b-4036d3f0de8e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-11 09:28:53.53086+00	
00000000-0000-0000-0000-000000000000	0118309b-0d08-4d88-b652-1e7dea831ed5	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-11 10:22:34.891782+00	
00000000-0000-0000-0000-000000000000	958c4f31-14a1-4dea-bba3-168e718c5863	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-11 10:28:57.035828+00	
00000000-0000-0000-0000-000000000000	76d3813d-4e39-4a50-b745-83f09f0b788c	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-11 11:26:47.021081+00	
00000000-0000-0000-0000-000000000000	1cc2a23e-9dbb-4ce7-bcdb-c70ff1a785b9	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-11 12:15:47.437697+00	
00000000-0000-0000-0000-000000000000	e34205fe-e3d8-416c-ba1a-f674160c613a	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-12 09:50:43.152918+00	
00000000-0000-0000-0000-000000000000	4fb4f44f-5a1d-4878-ae17-8fad35a27605	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-12 10:53:59.998983+00	
00000000-0000-0000-0000-000000000000	46135afa-3953-486c-8760-0acb40cda6ec	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-12 11:54:20.735498+00	
00000000-0000-0000-0000-000000000000	a5eb4a97-0f1f-4b49-ad81-81eb9d2ceb6a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 07:16:36.996498+00	
00000000-0000-0000-0000-000000000000	018c65b0-dbc0-49a4-9857-2ca53b8a674c	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 10:17:07.795758+00	
00000000-0000-0000-0000-000000000000	1b77bd60-21c9-466c-b0a9-2b93c28b8d14	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 12:41:57.16436+00	
00000000-0000-0000-0000-000000000000	5be3e8dc-0369-4506-85b9-21ad043a962b	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 13:14:33.8655+00	
00000000-0000-0000-0000-000000000000	00b90323-5511-479f-bcff-edd3b3c9d860	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 13:47:08.997692+00	
00000000-0000-0000-0000-000000000000	1c631f1d-e57e-44f9-a7cb-a63d514238a2	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 14:32:00.908306+00	
00000000-0000-0000-0000-000000000000	7c86b840-c4e1-4b58-83f8-0966af6a229b	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-13 14:49:12.931483+00	
00000000-0000-0000-0000-000000000000	cf799f94-65eb-40f2-925c-5288cd2657c1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-14 07:15:44.25132+00	
00000000-0000-0000-0000-000000000000	fc5b2eee-3056-4be8-b3c1-dccdc876e4c2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-15 07:44:19.529104+00	
00000000-0000-0000-0000-000000000000	316c898f-4ca7-4afe-8629-929536333586	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-15 14:47:55.967703+00	
00000000-0000-0000-0000-000000000000	94fe3caa-cacd-4ef4-924a-b59a61d4c8b5	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-15 18:43:29.715788+00	
00000000-0000-0000-0000-000000000000	43ce7498-383d-4baa-937c-368f5eb9a7e1	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-15 19:48:57.386206+00	
00000000-0000-0000-0000-000000000000	59fd1774-8a2d-4563-88c6-c143d3b50c18	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 06:53:07.185773+00	
00000000-0000-0000-0000-000000000000	8f491635-d2f6-4311-a0b3-af4cbde407d7	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 08:07:24.326956+00	
00000000-0000-0000-0000-000000000000	af29422e-b7ec-4d09-ad06-2f414aaa53ad	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 09:14:48.64885+00	
00000000-0000-0000-0000-000000000000	c34b52c3-1b51-49ca-9712-b9b8e8127ed3	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 10:17:47.333303+00	
00000000-0000-0000-0000-000000000000	7762f7d1-fe26-41dd-99d3-bf2b07eb0f74	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 12:08:05.038187+00	
00000000-0000-0000-0000-000000000000	2311c8ad-3485-4cb8-8d04-6db696ff0b92	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 12:54:34.865045+00	
00000000-0000-0000-0000-000000000000	6d9335cc-4417-45d4-b026-f95e93c88d5f	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 13:35:19.43137+00	
00000000-0000-0000-0000-000000000000	9295a75b-eca3-4c67-973b-5ea598cb8f55	{"action":"login","actor_id":"6b96221f-4b78-4d4a-82c4-3afb64233abd","actor_username":"roland.baumberger@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-16 14:07:16.999672+00	
00000000-0000-0000-0000-000000000000	5e372bb0-2275-4370-87e2-cd6bc02ccc1d	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-17 07:46:06.729421+00	
00000000-0000-0000-0000-000000000000	8b010f78-80c5-4773-9b8e-c5ccb5766ac0	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-17 09:25:17.043483+00	
00000000-0000-0000-0000-000000000000	de391adb-412e-4d51-9ced-72ed11f6fffe	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-17 10:40:59.3322+00	
00000000-0000-0000-0000-000000000000	16e184f4-93e9-4b59-b2b7-d7e4571f0c9e	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-17 11:59:04.037923+00	
00000000-0000-0000-0000-000000000000	242b7136-7489-438c-920d-7773caa13f57	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-19 06:04:45.035781+00	
00000000-0000-0000-0000-000000000000	1350771a-5de9-45d0-b57d-f22692692734	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-19 07:04:54.918179+00	
00000000-0000-0000-0000-000000000000	29bce55f-ed53-4a87-b2da-48059b4731f6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-19 08:06:09.962802+00	
00000000-0000-0000-0000-000000000000	0ba7b86e-bef0-48bb-b0da-11c8309a7ded	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-19 09:11:05.634066+00	
00000000-0000-0000-0000-000000000000	49cb4c64-3c42-405e-af6f-187a5298e67c	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-19 10:13:23.884068+00	
00000000-0000-0000-0000-000000000000	3a96a158-0d8f-4ca8-9910-7f5870596215	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-19 12:44:13.077999+00	
00000000-0000-0000-0000-000000000000	c2396870-6ab5-49e8-8ec2-c3656747e150	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-19 13:30:56.610156+00	
00000000-0000-0000-0000-000000000000	6bf148d1-87f6-4fb3-aa11-1ca74594560a	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-19 15:28:43.253827+00	
00000000-0000-0000-0000-000000000000	1ca448f1-ce4d-4896-8739-9c3dc8160c53	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-20 14:31:18.767777+00	
00000000-0000-0000-0000-000000000000	2e7585f8-bf25-4f6b-80f6-37d39ccf1c0f	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"philip.wehrens@swisstopo.ch","user_id":"83fc2446-4132-4a83-b6dd-7d117cceed26","user_phone":""}}	2023-11-20 14:32:33.656225+00	
00000000-0000-0000-0000-000000000000	8c92bd05-8606-48b5-93db-dcacf89d49e0	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"philip.wehrens@swisstopo.ch","user_id":"ef2ccc58-d6ef-4af7-a456-858a39200ebd"}}	2023-11-20 14:33:01.145178+00	
00000000-0000-0000-0000-000000000000	ae44feca-ed78-4825-8ca6-7c77e6814cb4	{"action":"user_signedup","actor_id":"ef2ccc58-d6ef-4af7-a456-858a39200ebd","actor_username":"philip.wehrens@swisstopo.ch","log_type":"team"}	2023-11-20 14:34:01.754072+00	
00000000-0000-0000-0000-000000000000	f44eabc3-1f4d-435e-90d1-c4de8124cd24	{"action":"user_modified","actor_id":"ef2ccc58-d6ef-4af7-a456-858a39200ebd","actor_username":"philip.wehrens@swisstopo.ch","log_type":"user"}	2023-11-20 14:34:24.874809+00	
00000000-0000-0000-0000-000000000000	c6f3d9a8-528e-4236-adb4-f4eea1bca1d1	{"action":"login","actor_id":"ef2ccc58-d6ef-4af7-a456-858a39200ebd","actor_username":"philip.wehrens@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-20 14:34:50.151531+00	
00000000-0000-0000-0000-000000000000	de4c4c94-f3b7-4a66-9450-1c59472708dc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-20 16:16:52.60536+00	
00000000-0000-0000-0000-000000000000	bc3c790a-3984-466b-a8e1-bf46ca57fb5e	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-11-20 16:27:59.158278+00	
00000000-0000-0000-0000-000000000000	9ea70354-277b-4c9d-a376-dadf2c24255d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 07:35:00.092733+00	
00000000-0000-0000-0000-000000000000	ad024913-847a-49cd-8301-2b87373721c3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 10:38:28.81127+00	
00000000-0000-0000-0000-000000000000	27b9c658-d302-4ea6-be68-a78a64dd1afb	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 10:51:42.990962+00	
00000000-0000-0000-0000-000000000000	d2a7b54a-f562-4695-a098-2340ff84db87	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 12:29:26.913388+00	
00000000-0000-0000-0000-000000000000	5c6c2900-450e-405b-82cf-77d49d6fb3d3	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 13:33:28.031522+00	
00000000-0000-0000-0000-000000000000	392b1438-0318-4684-a521-92154eb67975	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 14:45:38.408435+00	
00000000-0000-0000-0000-000000000000	bd8d20ce-68f7-44f6-8b0b-a4fa54fc8856	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 14:46:58.113408+00	
00000000-0000-0000-0000-000000000000	64b82760-3b80-41e4-b20f-9b50f9e4a107	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 15:37:27.001533+00	
00000000-0000-0000-0000-000000000000	b2376162-6d8f-400b-98d5-37b6e51093bf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-21 15:46:07.248783+00	
00000000-0000-0000-0000-000000000000	bec47d7f-495e-48c6-ae9e-fcc27365229c	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-11-21 16:29:54.680804+00	
00000000-0000-0000-0000-000000000000	9082b346-aa94-4d32-b8a7-5b46fbd4c840	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-22 07:04:52.650859+00	
00000000-0000-0000-0000-000000000000	a3081f19-39b7-4884-a79a-050aa11b551b	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-22 08:48:46.578636+00	
00000000-0000-0000-0000-000000000000	2ed43f80-3381-4ce7-821d-57ba3e59a0dc	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-22 10:13:23.030004+00	
00000000-0000-0000-0000-000000000000	bf3e6612-e621-4922-a33a-c66ed103ae5a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-22 10:18:31.447587+00	
00000000-0000-0000-0000-000000000000	324e314b-4d60-4c28-8c1e-922f9b91bc2e	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-22 12:54:18.553829+00	
00000000-0000-0000-0000-000000000000	bee3c862-f161-440b-ada8-ba5acadf42e7	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-22 14:00:35.492835+00	
00000000-0000-0000-0000-000000000000	257a961a-75f3-40cc-9942-37ec5afed8d2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-23 07:12:05.659392+00	
00000000-0000-0000-0000-000000000000	385b211e-2efe-4268-a09b-dfcba36084b0	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-23 09:25:50.633649+00	
00000000-0000-0000-0000-000000000000	0d3174df-75c4-471f-a49c-5c5b87466acc	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-23 14:25:42.440583+00	
00000000-0000-0000-0000-000000000000	7549e839-df38-4531-81bf-7e68e74ea12d	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-23 14:46:08.712581+00	
00000000-0000-0000-0000-000000000000	e875a79b-ee56-4a7e-a2db-a0871d96bf2c	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-23 15:48:13.082108+00	
00000000-0000-0000-0000-000000000000	616f275f-54f5-4187-b4a7-563a5783681f	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-23 19:13:15.754932+00	
00000000-0000-0000-0000-000000000000	d27ca04f-830e-42ea-b9b8-323d9394ad82	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-23 20:13:50.79082+00	
00000000-0000-0000-0000-000000000000	b318ea79-3bc9-4277-9494-a2354dfad37b	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-24 07:07:27.683598+00	
00000000-0000-0000-0000-000000000000	a9392cb1-15a2-4fe5-bd6e-41a27790b38a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-24 09:36:10.555788+00	
00000000-0000-0000-0000-000000000000	87ce1643-d681-4f35-af47-6a1a8e0ebd4b	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-24 12:52:59.476063+00	
00000000-0000-0000-0000-000000000000	46fd40ca-4dab-4368-bec6-5439fd860944	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-25 09:13:20.721378+00	
00000000-0000-0000-0000-000000000000	29f7b2c5-7dd0-4ba1-868e-20237ffb8f95	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-25 10:13:38.28698+00	
00000000-0000-0000-0000-000000000000	1c4b0c52-0be5-48c9-9822-87acaad69025	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-25 11:30:37.898583+00	
00000000-0000-0000-0000-000000000000	a777c6b6-e8ad-4b1b-816e-1220893bd8da	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-25 12:30:58.646038+00	
00000000-0000-0000-0000-000000000000	f0d567e2-d8bc-4d6b-a5f3-ce964b6bfd9f	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-25 13:21:23.785316+00	
00000000-0000-0000-0000-000000000000	0025fa77-9d81-44c1-9dc4-8b7d452238d0	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-26 14:17:50.629632+00	
00000000-0000-0000-0000-000000000000	c3dac865-adc7-412b-a6c1-30526865ffb9	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-26 15:19:25.624238+00	
00000000-0000-0000-0000-000000000000	4d913694-686d-4425-a948-697427724a0e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-26 17:16:10.520742+00	
00000000-0000-0000-0000-000000000000	916bd91c-008e-4a7f-9d50-92d7cfa6a275	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-26 18:17:48.214771+00	
00000000-0000-0000-0000-000000000000	9c0d3cbe-709d-4353-8a5e-aa8b30b1aa2f	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-26 19:18:01.164115+00	
00000000-0000-0000-0000-000000000000	c3741c2a-6e40-4a92-b1c9-ce4c452a8c95	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-26 20:23:24.222677+00	
00000000-0000-0000-0000-000000000000	d46afc5f-cf01-44b1-b279-8666156ee04a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 07:24:01.480108+00	
00000000-0000-0000-0000-000000000000	a85e5fc6-ab5b-437d-8396-8078f9df703c	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-11-27 10:06:48.624287+00	
00000000-0000-0000-0000-000000000000	abcd8fd5-f8f0-4622-a983-98401f88114d	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 12:58:39.431822+00	
00000000-0000-0000-0000-000000000000	95a66b27-dd9f-43a8-b1fb-ec9cbb0cc578	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 13:02:47.769787+00	
00000000-0000-0000-0000-000000000000	50851848-23d1-4e1d-8f39-2e59af647f48	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 13:46:58.405503+00	
00000000-0000-0000-0000-000000000000	31ea56f8-73f5-4215-b557-aaf76eeebfec	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 13:55:34.437942+00	
00000000-0000-0000-0000-000000000000	f2aa9f77-8fe8-46b1-8518-36510beccd83	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 14:20:07.685668+00	
00000000-0000-0000-0000-000000000000	9c7b6343-380a-4811-a103-8d5f1af17820	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-27 14:50:46.298151+00	
00000000-0000-0000-0000-000000000000	563ab5a3-ba94-4c6c-8974-5d5131124009	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-28 08:06:50.458884+00	
00000000-0000-0000-0000-000000000000	636d714a-fd55-4a05-a79d-8b8d854f77eb	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-28 12:46:16.294369+00	
00000000-0000-0000-0000-000000000000	8449bb4b-fa4c-45c5-b9fe-effaf6ebcc6a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-28 14:28:54.588805+00	
00000000-0000-0000-0000-000000000000	cfab2af1-fc6c-49d0-8c5a-23af1953bc6c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-28 15:29:04.971142+00	
00000000-0000-0000-0000-000000000000	4ad8a919-ab44-4812-8faa-75beb8fa65a4	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2023-11-28 16:28:18.651209+00	
00000000-0000-0000-0000-000000000000	3ab7b698-921e-498c-b8fb-836bb03e7963	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-28 21:43:22.374964+00	
00000000-0000-0000-0000-000000000000	b1f4a7f0-3127-4999-8b08-a131aded36d3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 07:19:00.395543+00	
00000000-0000-0000-0000-000000000000	232f766a-26ff-4d7f-b263-a36df0b199b7	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 10:06:58.987943+00	
00000000-0000-0000-0000-000000000000	79000180-0d2a-4e79-a147-23df5b3905dc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 10:27:03.255561+00	
00000000-0000-0000-0000-000000000000	3cc4e497-477f-41bb-8421-1850e57428f4	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 11:07:25.827898+00	
00000000-0000-0000-0000-000000000000	914d563f-6452-4bb7-ad14-beca97f92e6b	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 12:08:29.960208+00	
00000000-0000-0000-0000-000000000000	ade9f96f-0370-4b0c-81ee-13d9b3bbb685	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 12:29:54.680668+00	
00000000-0000-0000-0000-000000000000	b1ea5efc-3b1e-4110-abaf-33b369552203	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 13:09:48.236508+00	
00000000-0000-0000-0000-000000000000	bd995264-088b-4e70-9a92-9e4a9229619c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 13:30:04.994393+00	
00000000-0000-0000-0000-000000000000	59940a1a-dab3-432f-b730-1000d1342680	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 13:33:41.597708+00	
00000000-0000-0000-0000-000000000000	f2bcdc67-c20c-4e4f-9f0e-20b75cd00075	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 14:10:52.486222+00	
00000000-0000-0000-0000-000000000000	a26be3f6-b6e2-416d-b4fe-b338fa80c9c7	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 15:14:21.638237+00	
00000000-0000-0000-0000-000000000000	54eaa7e1-59f5-4142-a3c2-b0fd9c5ce59a	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 15:26:37.459235+00	
00000000-0000-0000-0000-000000000000	f6eb95f4-963f-4e86-968a-241816ad7d1f	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 16:28:37.128756+00	
00000000-0000-0000-0000-000000000000	155842b4-2c20-4dd7-accc-ab1a1a972deb	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 16:41:37.309231+00	
00000000-0000-0000-0000-000000000000	151d7ee7-d490-4594-b852-10e4cd4ab2f6	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 17:51:17.560051+00	
00000000-0000-0000-0000-000000000000	cbc59a10-d37b-41e1-b422-b6e16fff4119	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 18:55:15.613913+00	
00000000-0000-0000-0000-000000000000	15ebf2f4-2989-4425-8fb1-a26dec24bf1a	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-29 19:16:22.343996+00	
00000000-0000-0000-0000-000000000000	37749e46-7218-453c-9646-4c707ecd42d6	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 20:13:58.620386+00	
00000000-0000-0000-0000-000000000000	2f6b78f2-4c95-4171-b65e-fe20b014ed16	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 21:24:54.037157+00	
00000000-0000-0000-0000-000000000000	6c887a9f-bf08-4bc6-91dc-7e19ed517015	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 22:26:40.599319+00	
00000000-0000-0000-0000-000000000000	c81d53b7-9dc3-4339-be6e-ba7d367da271	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-29 23:31:11.786454+00	
00000000-0000-0000-0000-000000000000	9fb2508c-72dd-473d-bd98-52c40fe84a4d	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 00:31:58.546577+00	
00000000-0000-0000-0000-000000000000	0d5cf96d-ce29-46db-9573-5b0e296455a4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 07:09:36.939201+00	
00000000-0000-0000-0000-000000000000	a23793ae-9c70-4d16-a228-3aef276fddc7	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 08:25:59.87375+00	
00000000-0000-0000-0000-000000000000	b890c678-ba7e-46ac-86eb-d1182ef5f9cd	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 09:11:27.396038+00	
00000000-0000-0000-0000-000000000000	afa3a51e-dd52-4824-becb-69373dd72a5d	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 09:29:55.691415+00	
00000000-0000-0000-0000-000000000000	2afcacae-8593-45eb-9f3f-3cbfef5fc61e	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 10:14:12.212359+00	
00000000-0000-0000-0000-000000000000	99610fc3-6fc8-472e-b838-68c8a6a9259a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 10:30:51.638934+00	
00000000-0000-0000-0000-000000000000	acd523c0-3580-4fa9-8e41-9b3ab57acd43	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 12:26:05.500858+00	
00000000-0000-0000-0000-000000000000	a20da598-0d65-48fe-8f48-5d9ff6a1b9fb	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 13:26:48.061259+00	
00000000-0000-0000-0000-000000000000	fbf5dc1d-b016-41ac-bd4b-5003fc729719	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 13:43:37.177703+00	
00000000-0000-0000-0000-000000000000	15708258-5d81-4820-a780-ef6c3d85e427	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 13:59:08.403838+00	
00000000-0000-0000-0000-000000000000	89a805bc-6cbf-4122-a0f7-cbe7a3774337	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 14:10:53.34773+00	
00000000-0000-0000-0000-000000000000	ad479c23-f179-4956-a9cb-19dce5b3f5b2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 14:44:06.852733+00	
00000000-0000-0000-0000-000000000000	7bc54e71-578a-49a0-92a9-0aac82fa21ed	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 14:55:12.252346+00	
00000000-0000-0000-0000-000000000000	68d58be2-61ab-4df9-8087-2332ac5eb1c8	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 15:02:40.432514+00	
00000000-0000-0000-0000-000000000000	ec25a82d-443a-4ef6-b84b-1e57412f04e8	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 15:11:41.585469+00	
00000000-0000-0000-0000-000000000000	374b18b7-2578-4a08-b551-85dd9d549636	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 15:56:14.686953+00	
00000000-0000-0000-0000-000000000000	2e274030-f969-4af0-85d3-ee4a117a21a8	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 16:02:53.966587+00	
00000000-0000-0000-0000-000000000000	a711c459-8b93-4837-98b5-e56d81b40506	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-11-30 16:23:04.590596+00	
00000000-0000-0000-0000-000000000000	c51612ff-730a-4c62-9e5c-ab5f38cf1274	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 16:57:24.85205+00	
00000000-0000-0000-0000-000000000000	1380474e-e9a3-4e50-94bd-cf5878bb3c55	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 17:57:47.978514+00	
00000000-0000-0000-0000-000000000000	3768b06d-5483-45c0-9654-7b1e978de16a	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 19:24:00.59951+00	
00000000-0000-0000-0000-000000000000	d10c435b-5117-4567-b386-c086f39033fd	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 20:28:35.009974+00	
00000000-0000-0000-0000-000000000000	93f0a0dd-189f-46d4-a9f6-0e4b5d41fb42	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 21:32:12.608221+00	
00000000-0000-0000-0000-000000000000	18eceecf-263c-43e4-82e2-3dd1cabf4e6d	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-11-30 23:13:52.290409+00	
00000000-0000-0000-0000-000000000000	a44cd15a-5010-487f-bc61-5878a3fc0a3b	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-01 00:15:13.45876+00	
00000000-0000-0000-0000-000000000000	4d4a58d7-fc65-47cc-aa5b-52faa550013b	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-01 01:19:40.995141+00	
00000000-0000-0000-0000-000000000000	b4078b32-afb3-4e3b-a285-b6e1125a3a5b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-01 10:10:57.788232+00	
00000000-0000-0000-0000-000000000000	91a14f4c-1b83-4953-bbf8-8232c77f8d8e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-01 11:45:49.857518+00	
00000000-0000-0000-0000-000000000000	8fbeb325-ed20-4d1e-bc2b-8ab91ef32b7d	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-01 12:42:46.775514+00	
00000000-0000-0000-0000-000000000000	dbf1c36a-3acc-435f-ae86-35de37b6ebf2	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-01 13:21:22.624135+00	
00000000-0000-0000-0000-000000000000	ea5ab066-a9ac-48bd-be92-37d9bb64bab1	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-01 14:19:05.991505+00	
00000000-0000-0000-0000-000000000000	3bc52111-67f7-4353-817e-b084189eb894	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-01 14:37:44.682636+00	
00000000-0000-0000-0000-000000000000	af03d266-1989-4b11-928d-2565b4c33dc2	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-01 15:38:40.826492+00	
00000000-0000-0000-0000-000000000000	a1884d84-8d0e-45b9-a88d-6c083bc717ee	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-01 16:40:26.584054+00	
00000000-0000-0000-0000-000000000000	fb695b28-fc18-435a-9b82-e8e4a9691b5b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-03 08:38:10.797861+00	
00000000-0000-0000-0000-000000000000	5f219c0e-42b7-4348-8cf6-9e347fdad067	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-03 09:38:37.532212+00	
00000000-0000-0000-0000-000000000000	28ccae40-8a6d-477c-a810-cae3ddc06378	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-03 10:53:24.045378+00	
00000000-0000-0000-0000-000000000000	4628591e-702c-4024-9384-fa9eb65409c2	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-03 12:38:29.696748+00	
00000000-0000-0000-0000-000000000000	d3a7258e-b67f-4b93-8872-a6d55f7e48ab	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-04 15:04:57.652291+00	
00000000-0000-0000-0000-000000000000	b0847ac1-06e1-47e8-ad22-3d081c6fb1a2	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2023-12-04 16:35:36.578787+00	
00000000-0000-0000-0000-000000000000	68076db2-7cee-4c14-937c-fa45a8f5c61f	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 07:18:55.560473+00	
00000000-0000-0000-0000-000000000000	167afc47-f39e-427e-ab7c-32383e894905	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 07:18:59.018049+00	
00000000-0000-0000-0000-000000000000	15fbae28-7be1-4275-a029-aace0650629c	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 08:12:08.371585+00	
00000000-0000-0000-0000-000000000000	33e2ccfc-85d8-4292-a5b6-d4d4b5db1569	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 09:15:04.700199+00	
00000000-0000-0000-0000-000000000000	7614fc55-9b05-454e-a653-71cbe45a95d9	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 12:34:58.892781+00	
00000000-0000-0000-0000-000000000000	2154e035-89f6-4bcf-b0ee-b8681c2e8a14	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 12:36:59.953515+00	
00000000-0000-0000-0000-000000000000	dccd928d-eaff-495d-bb3a-55855045450d	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 14:21:08.916699+00	
00000000-0000-0000-0000-000000000000	b3c44957-1446-4ffe-934d-1fa93dd5de3b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-05 15:15:20.73367+00	
00000000-0000-0000-0000-000000000000	3b3f13d8-a99f-4ff3-ab99-4c3bd8bdfbe5	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-05 15:43:38.941208+00	
00000000-0000-0000-0000-000000000000	9602f397-8370-4fff-b340-0ed5a009a6eb	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-05 17:48:16.488203+00	
00000000-0000-0000-0000-000000000000	6f5e0452-ef55-48ed-90ba-36592ed1c7d1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-06 07:17:33.07682+00	
00000000-0000-0000-0000-000000000000	123ea82a-a6a5-4ba6-bc13-ae65c33f80ff	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-06 08:42:20.608528+00	
00000000-0000-0000-0000-000000000000	d7ef4612-2b49-482d-933e-a4f856123cc1	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-06 09:44:05.283636+00	
00000000-0000-0000-0000-000000000000	3c1106ed-656e-4d53-a1cd-a6b5c577238d	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-07 12:52:51.284895+00	
00000000-0000-0000-0000-000000000000	00e8f26a-3377-4795-829c-2506feadf029	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-07 21:12:52.172096+00	
00000000-0000-0000-0000-000000000000	f45b91fc-e1c5-4a52-8d5d-5015d2370086	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-08 07:05:10.722894+00	
00000000-0000-0000-0000-000000000000	6f3a9688-4b35-4daf-8e7c-6f4988b52591	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-09 10:58:41.983806+00	
00000000-0000-0000-0000-000000000000	205a6919-2a1d-401c-b420-79f255a228de	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-09 15:16:25.763051+00	
00000000-0000-0000-0000-000000000000	df3d1d38-e535-4084-8f3a-fa43f345a923	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-11 07:18:27.94837+00	
00000000-0000-0000-0000-000000000000	3d16b3c2-f0ab-490b-8a7a-34c1ef98534c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-12 09:58:07.641355+00	
00000000-0000-0000-0000-000000000000	0261a07f-e53d-48a9-b6a1-65591602722e	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-12 14:39:47.246624+00	
00000000-0000-0000-0000-000000000000	dd82a795-3614-432c-baee-1a8fa4eada34	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-12 15:43:30.973376+00	
00000000-0000-0000-0000-000000000000	109da009-2dc6-4289-baea-7a178710e35c	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-12-12 16:01:33.519103+00	
00000000-0000-0000-0000-000000000000	61f3195f-b316-4407-b4b9-f93ada9585de	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-13 07:17:46.731802+00	
00000000-0000-0000-0000-000000000000	e1d2a3ac-fec4-4dbf-887e-cb798d2a570a	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-13 09:13:32.529097+00	
00000000-0000-0000-0000-000000000000	6f8224d4-2551-4ac6-ae55-b2be82aa4bca	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-13 09:49:15.155234+00	
00000000-0000-0000-0000-000000000000	500d2dd6-80cc-440d-898e-02a54537bcbd	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-13 10:14:26.755787+00	
00000000-0000-0000-0000-000000000000	6c6c8798-46da-427d-ad10-f23ffeab1629	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-13 10:46:09.426854+00	
00000000-0000-0000-0000-000000000000	09020d4a-c990-4b06-bcc8-ce50966f2d56	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2023-12-13 11:04:30.280373+00	
00000000-0000-0000-0000-000000000000	40ba7d7a-81ce-4df2-8fc9-444445f896da	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-14 11:18:38.164104+00	
00000000-0000-0000-0000-000000000000	a6eccf66-60ef-446d-bd43-2f51e8f413aa	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-14 11:32:22.298897+00	
00000000-0000-0000-0000-000000000000	8e154841-1746-4fd8-a37e-1c4379587147	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-14 12:34:01.324976+00	
00000000-0000-0000-0000-000000000000	fa9143c7-aee9-4162-ad67-22e77a5d0c7a	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-14 12:47:48.363243+00	
00000000-0000-0000-0000-000000000000	065866e2-f81b-42bd-827b-aa79bddaf93c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-14 12:57:38.48925+00	
00000000-0000-0000-0000-000000000000	d0b3aa09-535e-47e7-8cb9-afcc37da1117	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-16 09:51:58.710358+00	
00000000-0000-0000-0000-000000000000	aea906ee-e60c-40c7-a6fc-d8aa208111c5	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-18 07:11:55.590588+00	
00000000-0000-0000-0000-000000000000	96689432-84f8-4f73-bb47-de0ee2e99b17	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-18 07:27:23.413725+00	
00000000-0000-0000-0000-000000000000	e34e4961-765d-4120-82b2-5258936a8901	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-18 08:19:56.795618+00	
00000000-0000-0000-0000-000000000000	1da6b0d5-a203-41bf-8279-dbf958a470c0	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-18 11:33:18.594593+00	
00000000-0000-0000-0000-000000000000	92497b99-1ddd-4466-9181-01b5f48aa61d	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-18 13:11:08.510496+00	
00000000-0000-0000-0000-000000000000	1e19db6f-91c6-4ad4-a1c1-00d01f32f5c6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-18 14:23:38.080307+00	
00000000-0000-0000-0000-000000000000	ad5d9917-5751-4d43-9dd8-ae67ef53e8fc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-19 08:37:37.979207+00	
00000000-0000-0000-0000-000000000000	29933d52-07b3-4cbe-ba21-080f71ce80ba	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-19 09:20:43.80126+00	
00000000-0000-0000-0000-000000000000	7fa6562a-2c80-4529-a2d6-eebe4e650d96	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-19 09:38:37.407574+00	
00000000-0000-0000-0000-000000000000	6d62a4a0-a4f3-4ae2-a510-c8720bee87d3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-19 12:47:47.599183+00	
00000000-0000-0000-0000-000000000000	84bb1407-82b8-4fa0-a73b-e526ed655550	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-19 14:58:30.811527+00	
00000000-0000-0000-0000-000000000000	f13529df-51a4-4033-9af2-a4eb1bd35ccf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 07:19:31.894597+00	
00000000-0000-0000-0000-000000000000	3dcdfc0b-031a-49cc-a0ed-d1513c3c8d00	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 08:22:00.782514+00	
00000000-0000-0000-0000-000000000000	23baa411-2f14-4ad7-9c52-e47b6f2e8655	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 09:09:15.554931+00	
00000000-0000-0000-0000-000000000000	caf6ad86-b018-4e37-a4be-35d6ea85a4ca	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 10:31:05.627872+00	
00000000-0000-0000-0000-000000000000	333800e6-01b4-4724-bbda-bf4794d22501	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 10:33:12.211709+00	
00000000-0000-0000-0000-000000000000	d2897c2c-62af-4655-b83b-1f48f89153ae	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 12:26:12.874252+00	
00000000-0000-0000-0000-000000000000	f7e77f71-cd13-4e6a-a0ea-e072f4327758	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 12:46:54.926703+00	
00000000-0000-0000-0000-000000000000	945c0a01-4bb6-4722-bbb6-7899943c3469	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 13:28:56.386125+00	
00000000-0000-0000-0000-000000000000	26fce2fe-f9ab-401d-8736-1cb0d87ec5e8	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 13:48:55.78815+00	
00000000-0000-0000-0000-000000000000	02747595-e7bb-4afd-b732-a674534726f3	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 14:49:11.665123+00	
00000000-0000-0000-0000-000000000000	b53ef5e9-64b8-4b97-af2e-483e2c151fd8	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 15:30:28.667302+00	
00000000-0000-0000-0000-000000000000	dcf44735-2ab6-4532-bffc-0dac7c15802c	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 15:50:12.205946+00	
00000000-0000-0000-0000-000000000000	6dd31a89-9cf0-4bd5-a863-35354f0c8b94	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-20 17:42:43.950023+00	
00000000-0000-0000-0000-000000000000	93d9ab94-7df1-4b29-acc8-60ab7af97b94	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-20 19:15:27.643741+00	
00000000-0000-0000-0000-000000000000	05c612c8-9c46-463e-b7f0-c37dd305d2a8	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-21 10:10:16.469979+00	
00000000-0000-0000-0000-000000000000	ea8a4cdd-b64c-4166-8459-86b86a77d1b6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-21 11:10:38.94856+00	
00000000-0000-0000-0000-000000000000	f3671a2a-59ea-41c5-a903-9075c5de6beb	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-22 18:42:19.239471+00	
00000000-0000-0000-0000-000000000000	ebe32032-8d77-451e-bb96-172d18c40fd5	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-22 19:42:48.722725+00	
00000000-0000-0000-0000-000000000000	5dd0182c-43a4-47e9-b811-7421658ebd02	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-24 09:58:43.258505+00	
00000000-0000-0000-0000-000000000000	d4b509f6-823a-4b80-b420-2a96036489f3	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-24 15:10:05.857266+00	
00000000-0000-0000-0000-000000000000	fffa290e-8b8d-4479-9367-cb1de795f3d8	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-24 16:12:10.175616+00	
00000000-0000-0000-0000-000000000000	7a90023b-4b36-4f62-9d8d-41e9d640a1c6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-26 08:20:53.159873+00	
00000000-0000-0000-0000-000000000000	3fde8cc4-dc32-43eb-9a65-68c7a838f7de	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-26 09:20:57.208559+00	
00000000-0000-0000-0000-000000000000	1b8759ec-d07d-4382-b2a6-c95d2e5fba4b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-26 10:21:16.84773+00	
00000000-0000-0000-0000-000000000000	d970ad36-65fa-4bd1-8624-74514d36e622	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 09:30:09.122084+00	
00000000-0000-0000-0000-000000000000	dbce9901-e90b-47f7-9986-6a1cddc7a658	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 10:52:27.249119+00	
00000000-0000-0000-0000-000000000000	afe577a5-231b-4776-8268-fc935c4ef863	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 12:01:23.509145+00	
00000000-0000-0000-0000-000000000000	baae01ee-567d-4e54-b433-839631aa1887	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-27 12:44:09.76621+00	
00000000-0000-0000-0000-000000000000	44043232-c3c1-4ca4-a8c4-2faf6aa664ec	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 13:02:58.468193+00	
00000000-0000-0000-0000-000000000000	dfba9d5b-68a7-49d7-802f-c27c3c2b4434	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-27 14:14:54.736802+00	
00000000-0000-0000-0000-000000000000	a731bb3a-581d-47a8-ad11-5be7e4379114	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 15:26:30.039518+00	
00000000-0000-0000-0000-000000000000	1184a780-7b81-4387-9f74-fe57a85c4d32	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 16:26:47.556124+00	
00000000-0000-0000-0000-000000000000	6b3178b0-6b2c-4e66-bcce-3ca1a70df605	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 17:27:36.618831+00	
00000000-0000-0000-0000-000000000000	4c0bc221-285b-498c-8f67-0d135a5b5a4e	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 18:29:25.186861+00	
00000000-0000-0000-0000-000000000000	26d424cf-0b4f-4dca-97f8-7a4af59ce54c	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 20:43:16.043079+00	
00000000-0000-0000-0000-000000000000	187d91b9-b02e-43d0-ad73-ef10e0d41382	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-27 21:44:10.041853+00	
00000000-0000-0000-0000-000000000000	f99a6675-5c4b-4901-9773-42dd99ffd804	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-29 13:15:38.39534+00	
00000000-0000-0000-0000-000000000000	664107b5-d150-4ff3-9d6e-29daa37466c4	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-30 11:26:55.353173+00	
00000000-0000-0000-0000-000000000000	4271fca2-7f26-4e64-9908-d39df8dddd32	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-30 13:38:25.603121+00	
00000000-0000-0000-0000-000000000000	e69110c7-c12f-434c-bd17-7c63a1c73a84	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-30 14:45:10.922769+00	
00000000-0000-0000-0000-000000000000	45e87b8e-2be5-445b-ad81-372cce2a7c30	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-30 16:02:13.116712+00	
00000000-0000-0000-0000-000000000000	f65775d7-562e-4349-beed-5da23fbb092e	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-30 17:02:35.05185+00	
00000000-0000-0000-0000-000000000000	836366c0-b05b-4777-9850-966377004c1e	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-30 18:02:37.512309+00	
00000000-0000-0000-0000-000000000000	9369d1e3-2e63-48fd-affe-115c7f6b2c6b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-31 08:58:50.536087+00	
00000000-0000-0000-0000-000000000000	51f89277-65fe-489c-acf7-8727544b19b3	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-31 09:31:15.89743+00	
00000000-0000-0000-0000-000000000000	f06a0943-4223-47ef-be65-5c7801edf123	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-31 10:05:05.942731+00	
00000000-0000-0000-0000-000000000000	f563956c-bbe5-4952-a198-072f1fe5aba3	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-31 11:06:31.968318+00	
00000000-0000-0000-0000-000000000000	2cae12fd-8e98-49a0-9b24-bd9e2940ffde	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-31 12:07:14.555402+00	
00000000-0000-0000-0000-000000000000	744facd8-48eb-4ea1-8dde-7aa68ffde436	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-31 12:50:28.609544+00	
00000000-0000-0000-0000-000000000000	9307897e-6199-4073-987b-ab628e902704	{"action":"login","actor_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","actor_username":"leonora.lehmann@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2023-12-31 13:50:52.31118+00	
00000000-0000-0000-0000-000000000000	5205c042-afa4-47e9-a604-37bac481657e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-31 14:07:02.426526+00	
00000000-0000-0000-0000-000000000000	aade1a9a-0cc9-4573-a620-bfcc776bcdcf	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2023-12-31 16:19:09.434321+00	
00000000-0000-0000-0000-000000000000	81b44330-f212-47cd-a2a3-8ef410f94384	{"action":"user_recovery_requested","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"user"}	2024-01-03 15:45:29.217338+00	
00000000-0000-0000-0000-000000000000	a70c998e-79d7-4650-9123-27bea0924ad7	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account"}	2024-01-03 15:45:54.957423+00	
00000000-0000-0000-0000-000000000000	345603a5-d855-4117-ab2e-70ac9a16f506	{"action":"user_modified","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"user"}	2024-01-03 15:46:32.161561+00	
00000000-0000-0000-0000-000000000000	03aa0f1a-46af-4d05-a250-5dc91c6b14ea	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-05 07:04:45.625983+00	
00000000-0000-0000-0000-000000000000	7bf303c4-d0ec-42a0-9cbb-f76bb1849583	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-05 12:17:45.046164+00	
00000000-0000-0000-0000-000000000000	7d19bfc4-013c-47b1-90ff-36c67c5abffa	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 08:06:16.997105+00	
00000000-0000-0000-0000-000000000000	df8e7128-66e0-436a-9f4c-91f6bab64323	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 09:44:18.964153+00	
00000000-0000-0000-0000-000000000000	3e1ae543-b4cf-4859-a840-263bb1388001	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 10:44:57.295925+00	
00000000-0000-0000-0000-000000000000	04d7ef09-7fa8-47fa-bd72-8dcb51a25a46	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 12:40:04.479073+00	
00000000-0000-0000-0000-000000000000	d58df16b-37cd-42e9-aa9b-2a41fc4d57b9	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 13:43:12.469304+00	
00000000-0000-0000-0000-000000000000	912c6b52-2518-4c20-b357-1d2c47537cbb	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 14:44:23.972177+00	
00000000-0000-0000-0000-000000000000	85f8d082-ec07-41c4-b363-cd1331353d1f	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 15:42:56.146254+00	
00000000-0000-0000-0000-000000000000	d445e2f6-0cf8-4c31-8719-9350c40268cf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 15:46:14.387022+00	
00000000-0000-0000-0000-000000000000	69906093-d57f-4157-92cc-bef63f5050e2	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-09 16:21:53.00774+00	
00000000-0000-0000-0000-000000000000	e0fe0fa9-e900-4233-ae90-3dd94ddd5ba2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-09 16:22:01.987239+00	
00000000-0000-0000-0000-000000000000	1d926161-9749-454b-a095-11aa573b4505	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-09 16:24:55.039435+00	
00000000-0000-0000-0000-000000000000	b14bc1b2-aece-4cf5-8650-90d8b14c4af1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-10 07:14:03.538063+00	
00000000-0000-0000-0000-000000000000	3a391d6d-c486-4790-955f-2266760878a1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-11 06:58:29.275606+00	
00000000-0000-0000-0000-000000000000	885fe194-a068-4cf3-839b-69230123c1e9	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-11 08:50:51.379853+00	
00000000-0000-0000-0000-000000000000	0d648c93-0ae5-4eba-b8d1-b808f76a5235	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-11 10:06:19.261833+00	
00000000-0000-0000-0000-000000000000	44b68dac-13d1-4810-812f-d52f79d48097	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-11 11:07:59.289582+00	
00000000-0000-0000-0000-000000000000	7db872ea-f515-4300-9769-cb0408f71d47	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-11 12:24:14.151595+00	
00000000-0000-0000-0000-000000000000	c9ae2824-2bde-4db6-89e9-aaf8922a2e07	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-11 14:44:43.634394+00	
00000000-0000-0000-0000-000000000000	685b92e6-df5c-48b1-b132-98145d558557	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-11 16:09:01.022839+00	
00000000-0000-0000-0000-000000000000	96a65233-3857-4c2b-83c1-0bbe4eb24434	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-11 16:16:30.392869+00	
00000000-0000-0000-0000-000000000000	86cccee8-ef07-44f9-924c-fd7d5d1bba85	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 07:16:18.717156+00	
00000000-0000-0000-0000-000000000000	562ec5bf-07f4-403a-9eaa-ab3ed3da1214	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 08:16:51.355537+00	
00000000-0000-0000-0000-000000000000	5ce2fc95-40e8-4a2d-8816-b5534f9343f8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 09:29:57.844661+00	
00000000-0000-0000-0000-000000000000	d7938c5c-07d1-4930-b473-6e1e09d4bd58	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 09:48:30.16096+00	
00000000-0000-0000-0000-000000000000	ed531084-6e32-4608-ab76-63c65b4a8914	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 11:52:03.859827+00	
00000000-0000-0000-0000-000000000000	fb3a8a85-fcad-4874-857d-f6014e4935bf	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 12:11:39.574462+00	
00000000-0000-0000-0000-000000000000	2470405e-6986-4993-8ce7-c8fb2fc2a075	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-12 15:06:18.912348+00	
00000000-0000-0000-0000-000000000000	039c585e-5080-457d-8cb1-4b0daff23875	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 15:25:59.862343+00	
00000000-0000-0000-0000-000000000000	ac2e9ce4-1767-4528-a498-95795ceb4171	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-12 16:18:32.847469+00	
00000000-0000-0000-0000-000000000000	06960041-2aaa-4428-b6b9-351da42c99ff	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-12 16:21:19.712333+00	
00000000-0000-0000-0000-000000000000	290d07a5-a1b8-4bf9-a1ff-77b6e8c3d17c	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-12 16:51:21.327642+00	
00000000-0000-0000-0000-000000000000	c7e123c9-ac2f-466b-8469-aebb9d77bc2c	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-14 08:19:55.038986+00	
00000000-0000-0000-0000-000000000000	07c943d3-42a4-40ee-955e-0c81fc5c6a84	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-14 09:22:00.816687+00	
00000000-0000-0000-0000-000000000000	84f29b89-0286-4234-99b6-b67ad2708635	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-14 10:23:21.574837+00	
00000000-0000-0000-0000-000000000000	75c75ea9-0e2f-4b15-862b-dccff6f33b58	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-15 09:19:19.91492+00	
00000000-0000-0000-0000-000000000000	0f16e6dc-c656-41df-a121-5d36102993cd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-15 10:19:50.791146+00	
00000000-0000-0000-0000-000000000000	220a5d4c-b401-4889-89da-e44c4344c3e6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-15 14:10:06.011579+00	
00000000-0000-0000-0000-000000000000	cc0887d0-c4da-419d-9346-2c6f5e18f6d2	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-15 14:57:44.802318+00	
00000000-0000-0000-0000-000000000000	7d852cb2-298b-45a3-9855-dac27f31bf79	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-15 15:11:06.461461+00	
00000000-0000-0000-0000-000000000000	2e2a9095-7e61-4a60-83ce-70e6d3dd909f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 08:53:58.869349+00	
00000000-0000-0000-0000-000000000000	c7e635ac-9e84-4ac1-a793-894b6c04d51c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 09:57:10.506654+00	
00000000-0000-0000-0000-000000000000	83104259-d31e-4e58-b505-fd53153bc377	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 09:58:25.901039+00	
00000000-0000-0000-0000-000000000000	397b5011-9d4d-47cf-bfc0-0bc27a4584fd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 12:54:30.813551+00	
00000000-0000-0000-0000-000000000000	fb582b9e-647f-4ee2-ae8f-ebe0aae36c3f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 14:43:03.574975+00	
00000000-0000-0000-0000-000000000000	66351ee9-3810-4f31-8967-328a893c3554	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"rafael.brunner@ebp.ch","user_id":"0f263b32-fad7-4b16-be21-370b63cb7797"}}	2024-01-16 14:44:16.735529+00	
00000000-0000-0000-0000-000000000000	c74f0af9-5d05-442e-a32b-9dd262e32047	{"action":"user_signedup","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"team"}	2024-01-16 14:44:30.486401+00	
00000000-0000-0000-0000-000000000000	4f695290-d901-490e-b198-5444336a7052	{"action":"user_recovery_requested","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"user"}	2024-01-16 15:04:30.07004+00	
00000000-0000-0000-0000-000000000000	37ad4f22-58f5-4d99-bca3-86908ae76ff2	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account"}	2024-01-16 15:04:52.939819+00	
00000000-0000-0000-0000-000000000000	57221edf-8a4a-4c79-aa65-20edbfd59fb6	{"action":"user_modified","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"user"}	2024-01-16 15:05:11.12928+00	
00000000-0000-0000-0000-000000000000	2d1c2901-8950-436c-90f2-999560b4ac2e	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 15:06:52.612706+00	
00000000-0000-0000-0000-000000000000	60e37758-0712-44d9-8b3c-d5bb7b8a87d9	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 15:07:15.287013+00	
00000000-0000-0000-0000-000000000000	cd1134fe-194e-4516-863b-0bd4c81cef8f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 15:33:04.190165+00	
00000000-0000-0000-0000-000000000000	55511315-d9fb-495c-9b1a-fc21f6b2799e	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-16 15:42:35.875076+00	
00000000-0000-0000-0000-000000000000	8045a611-6cf3-4aed-876f-329e3630accc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 15:43:06.258832+00	
00000000-0000-0000-0000-000000000000	b8cf2192-8a34-4594-a87f-e3939ae5f158	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"alex.graf@ebp.ch","user_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df"}}	2024-01-16 15:47:30.072143+00	
00000000-0000-0000-0000-000000000000	c2fe2b20-81ec-40d6-894a-3f2442d28e2a	{"action":"user_signedup","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"team"}	2024-01-16 15:47:50.462523+00	
00000000-0000-0000-0000-000000000000	d82deced-b09e-4b29-87c8-84f555342c68	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"daniel.jovanovic@geowerkstatt.ch","user_id":"ec61575d-322c-48ae-80c3-f9b2d9b4ce80"}}	2024-01-16 15:48:19.169461+00	
00000000-0000-0000-0000-000000000000	dde9cb1e-9109-448d-ac96-7d0feedabe12	{"action":"user_signedup","actor_id":"ec61575d-322c-48ae-80c3-f9b2d9b4ce80","actor_username":"daniel.jovanovic@geowerkstatt.ch","log_type":"team"}	2024-01-16 15:52:42.021491+00	
00000000-0000-0000-0000-000000000000	7b9df468-d3e4-442b-89ba-95eb7e3e7b92	{"action":"user_modified","actor_id":"ec61575d-322c-48ae-80c3-f9b2d9b4ce80","actor_username":"daniel.jovanovic@geowerkstatt.ch","log_type":"user"}	2024-01-16 15:53:27.55367+00	
00000000-0000-0000-0000-000000000000	6557aeb0-913b-4a99-a885-3e30142818cf	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-01-16 16:07:06.181484+00	
00000000-0000-0000-0000-000000000000	b3eeaebc-27be-4807-b609-6f1f7ae8149b	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-16 16:19:36.874616+00	
00000000-0000-0000-0000-000000000000	1060e0b2-dd82-4cc5-bf24-0659bea028b9	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-16 16:23:53.41218+00	
00000000-0000-0000-0000-000000000000	58b6122a-d499-4322-8265-0941318b9ce1	{"action":"user_recovery_requested","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"user"}	2024-01-17 06:39:58.425578+00	
00000000-0000-0000-0000-000000000000	fa2bb77e-676a-4d5c-959a-2ea84f4c0856	{"action":"login","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"account"}	2024-01-17 06:41:30.37177+00	
00000000-0000-0000-0000-000000000000	7e90e79d-d4e1-4a37-b193-3f595daa8f68	{"action":"user_modified","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"user"}	2024-01-17 06:41:38.856923+00	
00000000-0000-0000-0000-000000000000	dc3704cf-ebb6-4a0c-bed3-b3f213ae43ad	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 07:10:33.591071+00	
00000000-0000-0000-0000-000000000000	c5c9de4a-44a9-40b7-952f-8c5b143f7c55	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 07:37:09.373285+00	
00000000-0000-0000-0000-000000000000	d4e4a6e2-8228-4fbf-beb3-81356f21a17d	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 08:15:41.288676+00	
00000000-0000-0000-0000-000000000000	d6e099d9-0863-4f04-9cac-821891618e0f	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 08:18:17.606995+00	
00000000-0000-0000-0000-000000000000	1a89bfdf-7e33-4b4b-b0de-d6687f946f54	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 09:07:26.219716+00	
00000000-0000-0000-0000-000000000000	d10bd787-8e0b-4ecb-9e39-9712059ec3f2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 09:38:06.103123+00	
00000000-0000-0000-0000-000000000000	c07f5e70-9ef7-428e-9649-1e9a5c261241	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 10:39:11.658689+00	
00000000-0000-0000-0000-000000000000	b96bdf7c-3aec-47ea-834d-89d476f83eff	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-17 10:51:32.916651+00	
00000000-0000-0000-0000-000000000000	9964cf62-e04c-49da-9617-29cc415c4ae8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 11:54:58.573054+00	
00000000-0000-0000-0000-000000000000	6a039906-e970-4045-8982-b245f6753296	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 12:21:29.617897+00	
00000000-0000-0000-0000-000000000000	63d28486-a87a-41f0-900b-09988f9fb4f8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 12:55:15.183336+00	
00000000-0000-0000-0000-000000000000	9b69b2fb-09c6-4846-b5b3-f6060006367c	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 13:22:57.60369+00	
00000000-0000-0000-0000-000000000000	217d5ccb-8ca2-4b1b-9c9d-440ea16b7d4b	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-01-17 13:27:23.747279+00	
00000000-0000-0000-0000-000000000000	fa992e14-dbca-44bb-8906-b8fbd75f1d06	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-17 15:00:57.082768+00	
00000000-0000-0000-0000-000000000000	cdbaef8c-e456-4826-b502-f67d07013db6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 07:09:37.188556+00	
00000000-0000-0000-0000-000000000000	7fb5aa38-251c-4fba-8826-6dde28b51b5f	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-18 08:19:58.700612+00	
00000000-0000-0000-0000-000000000000	c69e38bc-1431-4fc7-bac3-bb0cc1771420	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-18 09:24:22.637637+00	
00000000-0000-0000-0000-000000000000	2a2eaef1-f67c-45b9-8a47-04fcf033bdb4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 10:02:12.858843+00	
00000000-0000-0000-0000-000000000000	fbba2451-48e1-4f45-ad96-ee2f0ae629c9	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stefan.volken@swisstopo.ch","user_id":"ee44378b-bb2c-41b3-95d6-3c492614687a","user_phone":""}}	2024-01-18 10:04:43.095859+00	
00000000-0000-0000-0000-000000000000	3bef3e15-42c5-4dc1-b990-ac0c8f771317	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stefan.volken@swisstopo.ch","user_id":"ce61cac2-364a-4d66-8f93-0b25ba769729"}}	2024-01-18 10:06:23.656119+00	
00000000-0000-0000-0000-000000000000	d3edeb70-c4ea-410d-a401-5d387729c748	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-18 10:32:32.415194+00	
00000000-0000-0000-0000-000000000000	0e93909c-5ece-4491-8564-30246b627114	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 11:12:45.627309+00	
00000000-0000-0000-0000-000000000000	a4c304b7-2a88-4259-8135-5fcc76afb223	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-18 11:49:25.996241+00	
00000000-0000-0000-0000-000000000000	fd063d13-50f4-4abb-8b72-d3c23d046469	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 12:35:02.667644+00	
00000000-0000-0000-0000-000000000000	7dc6a7f3-ceba-40d5-a664-305b5c736f57	{"action":"user_signedup","actor_id":"ce61cac2-364a-4d66-8f93-0b25ba769729","actor_username":"stefan.volken@swisstopo.ch","log_type":"team"}	2024-01-18 12:35:40.461534+00	
00000000-0000-0000-0000-000000000000	14d15b91-1941-4999-8eac-de3a570bea86	{"action":"user_modified","actor_id":"ce61cac2-364a-4d66-8f93-0b25ba769729","actor_username":"stefan.volken@swisstopo.ch","log_type":"user"}	2024-01-18 12:35:58.837105+00	
00000000-0000-0000-0000-000000000000	a198ba9a-c278-40a1-93af-7385db620e76	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 12:44:00.517045+00	
00000000-0000-0000-0000-000000000000	d646b0a3-beb7-47da-83bb-250d9190f5f7	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-18 12:50:30.739395+00	
00000000-0000-0000-0000-000000000000	28ad0053-0644-4056-8f73-cf82e2518049	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 14:07:16.688927+00	
00000000-0000-0000-0000-000000000000	fbf69cab-3ec8-412c-80d0-ad144400a6b6	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 14:58:27.290881+00	
00000000-0000-0000-0000-000000000000	a26fccb9-df87-4f44-b19c-3f8632cfe5df	{"action":"logout","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account"}	2024-01-18 14:58:57.205857+00	
00000000-0000-0000-0000-000000000000	354d10e1-c659-4664-acd1-be53f2ad13cd	{"action":"login","actor_id":"a5c53661-4d09-4805-9190-0a66a7407d31","actor_username":"peter.hayoz@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 14:58:58.701307+00	
00000000-0000-0000-0000-000000000000	40df484b-6fcb-4f83-8075-a82985232cfd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-18 15:07:35.068163+00	
00000000-0000-0000-0000-000000000000	193a4bff-4597-44b8-948a-3dfb0475fccc	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-19 07:22:18.332029+00	
00000000-0000-0000-0000-000000000000	fc982341-e125-4a04-8416-5dda66e64225	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-19 09:44:48.526227+00	
00000000-0000-0000-0000-000000000000	7117ed40-c11f-4169-8a2b-1f145dd0e2d4	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-19 12:40:57.603576+00	
00000000-0000-0000-0000-000000000000	b0c78baa-71d3-4d8d-8f88-005708db899c	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-19 13:25:57.940781+00	
00000000-0000-0000-0000-000000000000	204e85d0-3a16-4fae-9be2-99ba0b5ed612	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-19 15:09:35.955277+00	
00000000-0000-0000-0000-000000000000	e2e26a2e-45cc-44da-a8d9-0ee990a2dcc6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-19 16:18:05.738951+00	
00000000-0000-0000-0000-000000000000	a062eb26-d627-49fc-9131-eb68ab94c637	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-19 18:55:45.723775+00	
00000000-0000-0000-0000-000000000000	23d2ffeb-e9ac-4dc0-9d39-8330355209b8	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-21 09:15:48.970959+00	
00000000-0000-0000-0000-000000000000	41de14d9-3769-49a6-b18b-7fe0ef4ed2f4	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-21 10:21:51.892212+00	
00000000-0000-0000-0000-000000000000	fdec6858-bacf-4d5e-a550-360229679b56	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-21 10:30:20.553727+00	
00000000-0000-0000-0000-000000000000	ade7a272-d844-4a7a-9b9d-5fbb657d9a65	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-21 11:23:44.725017+00	
00000000-0000-0000-0000-000000000000	27ed81e0-2620-4d05-a92b-56ba5a8aac89	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-21 12:46:05.24557+00	
00000000-0000-0000-0000-000000000000	97b7da54-2aee-4a98-b698-1ea3d70e3a09	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-22 10:49:58.369814+00	
00000000-0000-0000-0000-000000000000	a8a0ce09-37de-4eee-96e7-d4d79873a81d	{"action":"login","actor_id":"d128758c-c2ea-406d-99f8-4568706ba91e","actor_username":"laurent.thum@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-22 12:16:32.869338+00	
00000000-0000-0000-0000-000000000000	230c7cea-85d6-475c-a387-cad04f1253ab	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-22 12:52:30.465439+00	
00000000-0000-0000-0000-000000000000	275c16f9-6fa3-4151-9b51-9f266fed7eec	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-22 14:28:03.066363+00	
00000000-0000-0000-0000-000000000000	a1e0c30d-c573-4f23-8998-9187524b4269	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-22 15:10:04.536187+00	
00000000-0000-0000-0000-000000000000	77f7dc4c-05a6-4650-abe2-340f7b2118e1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-22 15:12:05.09976+00	
00000000-0000-0000-0000-000000000000	3efd2205-c120-4051-b0d0-9da838730cd9	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-22 15:43:14.446143+00	
00000000-0000-0000-0000-000000000000	c7b643c2-68bc-474e-a4c2-563ce7bb467e	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-22 15:55:26.511431+00	
00000000-0000-0000-0000-000000000000	5de64a7a-a016-4914-8350-fc06234530b8	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 07:11:01.011428+00	
00000000-0000-0000-0000-000000000000	3a22bec8-16a6-45de-a2eb-631ed6e6d2b0	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 07:15:24.628596+00	
00000000-0000-0000-0000-000000000000	6fa26d84-ff82-40a3-a539-8649fcd21e32	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 07:30:54.112457+00	
00000000-0000-0000-0000-000000000000	f63845e7-9649-44e3-9ecd-0919871afc1d	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-23 08:06:22.366252+00	
00000000-0000-0000-0000-000000000000	464de97b-7e2d-4d54-9874-d373fc7920f2	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 08:11:48.910185+00	
00000000-0000-0000-0000-000000000000	e9cb0e2c-d161-4dcd-a722-5bd2909384b9	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 08:14:07.656294+00	
00000000-0000-0000-0000-000000000000	65ddaae5-ac6b-4b98-82fb-37ae12509e80	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 09:12:02.54434+00	
00000000-0000-0000-0000-000000000000	7c2a6bf7-878a-4b3c-8a91-e5886ee5f972	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-01-23 09:20:30.524841+00	
00000000-0000-0000-0000-000000000000	59409449-28b2-4368-98e2-a8ee41fbedcd	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-23 09:23:28.350517+00	
00000000-0000-0000-0000-000000000000	055129b2-1d98-4166-9cfe-390c815f628e	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 09:51:06.077395+00	
00000000-0000-0000-0000-000000000000	1ce616b6-b625-427c-8706-ba5662a88d2f	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-23 10:24:59.245232+00	
00000000-0000-0000-0000-000000000000	91529a51-1b39-4148-b44a-19dbdb4210ea	{"action":"login","actor_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","actor_username":"laurent.scheurer@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 11:01:23.952585+00	
00000000-0000-0000-0000-000000000000	0edc8c02-fbe7-48b0-9067-c2cf38b30cbe	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 12:16:35.242315+00	
00000000-0000-0000-0000-000000000000	17539bd2-108c-4952-9874-856463a28031	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 12:41:50.034206+00	
00000000-0000-0000-0000-000000000000	86de84b8-b2ab-47d6-893d-806d6edc4cc9	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 13:43:25.329729+00	
00000000-0000-0000-0000-000000000000	41c13e0e-7411-48dd-9d0d-0efd33beb305	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-23 13:48:38.242139+00	
00000000-0000-0000-0000-000000000000	95e863ce-65e7-4ff7-b236-8a86ea85064e	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 13:51:36.55352+00	
00000000-0000-0000-0000-000000000000	96c30261-7d7a-4541-8310-a507aa8e62c1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 14:17:00.034852+00	
00000000-0000-0000-0000-000000000000	e2c27715-21e1-4619-9439-748e3ecdef4d	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 14:50:38.549756+00	
00000000-0000-0000-0000-000000000000	c0b7e7eb-ab0a-4704-81f9-6f6f728dfd01	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-23 14:52:36.493539+00	
00000000-0000-0000-0000-000000000000	08a06788-fb50-4604-bf9b-61d4b19cfa8f	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-23 14:57:34.191745+00	
00000000-0000-0000-0000-000000000000	c79a8b1a-e957-4620-84a8-1b2eda61f17e	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-23 15:52:37.199262+00	
00000000-0000-0000-0000-000000000000	45d1d85f-02fc-475a-b27e-92bc695413d1	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 16:45:48.27213+00	
00000000-0000-0000-0000-000000000000	93dda620-ce7f-41b5-b4ce-4f9f22c6c71a	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 17:47:30.906086+00	
00000000-0000-0000-0000-000000000000	9d26739b-669d-4a28-bd4f-888c3ae52997	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 19:04:34.564309+00	
00000000-0000-0000-0000-000000000000	299a1bdf-738e-49b1-a81b-55e7b734d64d	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 20:25:03.059141+00	
00000000-0000-0000-0000-000000000000	d8b54231-9c92-4071-9cd6-001a2f342c2a	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-23 21:33:33.655931+00	
00000000-0000-0000-0000-000000000000	c1982990-fcf0-4ab4-b513-4d07328ef48a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 07:26:52.68216+00	
00000000-0000-0000-0000-000000000000	8488d806-d04e-4f2c-8726-256c3a46dc21	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 08:41:24.02835+00	
00000000-0000-0000-0000-000000000000	a7d211db-d21a-47c5-ae27-fe88c045b2ad	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 09:08:07.598795+00	
00000000-0000-0000-0000-000000000000	159f74d5-11f5-42da-bd02-9f54d25c334e	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 09:28:15.164343+00	
00000000-0000-0000-0000-000000000000	2bf32da8-c6f1-48a6-aef7-bbcf3c0bba73	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 09:29:08.020312+00	
00000000-0000-0000-0000-000000000000	be5bb31e-5e55-4214-810b-f0bed6a1264f	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 10:09:05.077385+00	
00000000-0000-0000-0000-000000000000	761f5f75-4603-4abf-83de-b86096e4311e	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-01-24 10:10:48.381494+00	
00000000-0000-0000-0000-000000000000	87a097fe-9953-4b4d-849f-1c2a76f7a2ab	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 10:39:43.345872+00	
00000000-0000-0000-0000-000000000000	f48f0d3a-96d0-4a58-a491-2a7bc4a7f1a6	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 12:33:53.794846+00	
00000000-0000-0000-0000-000000000000	2b576c8e-2cbc-4034-8cc3-62bab5aa01a6	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 12:37:33.472207+00	
00000000-0000-0000-0000-000000000000	26348d4a-09f3-4559-99e6-52f6053d66be	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 13:37:44.210086+00	
00000000-0000-0000-0000-000000000000	ba64c507-0eac-4d99-ba4c-89fa2354ad98	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 13:45:25.942672+00	
00000000-0000-0000-0000-000000000000	5fa141eb-b395-40d6-a7c3-c1227fccf6bd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 14:04:17.378538+00	
00000000-0000-0000-0000-000000000000	0f002b8f-f03d-4ad1-b4b4-ae11c60d7943	{"action":"login","actor_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","actor_username":"thomas.galfetti@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 14:12:42.562046+00	
00000000-0000-0000-0000-000000000000	bb7a5ac7-25cc-463a-9636-2a96a457f740	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 14:37:59.363871+00	
00000000-0000-0000-0000-000000000000	1f7ee34a-f2e0-43c3-9877-070f467e3748	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 14:47:01.033253+00	
00000000-0000-0000-0000-000000000000	26d536be-8849-4c23-8991-931508f9bad2	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 15:06:25.267446+00	
00000000-0000-0000-0000-000000000000	33c848f0-82c7-4eb8-aed9-e291b2b6f425	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 15:38:50.755882+00	
00000000-0000-0000-0000-000000000000	f526c758-fc1e-4a3d-93b1-d5745bf5f24a	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 15:48:15.371797+00	
00000000-0000-0000-0000-000000000000	1ae78772-72a0-44a4-93fb-6cead21c0667	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-24 16:06:34.66685+00	
00000000-0000-0000-0000-000000000000	f8eced74-1bf1-40f4-9389-de7b963537cd	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-01-24 16:15:46.881184+00	
00000000-0000-0000-0000-000000000000	2cff53f8-ef9a-4a9e-a44f-a34f1e3352d9	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 17:01:10.994925+00	
00000000-0000-0000-0000-000000000000	ce8b2ad1-7d40-4252-a159-ac269a33667f	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 19:41:18.79045+00	
00000000-0000-0000-0000-000000000000	cd6c98b7-1e11-44f3-b450-ff42e6f1b5b7	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 20:42:39.654437+00	
00000000-0000-0000-0000-000000000000	7376f266-4236-4786-ad9b-8606f9b167b3	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 21:42:58.569362+00	
00000000-0000-0000-0000-000000000000	64251414-9b00-465d-b232-12d55f2e9b78	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-24 22:43:14.840662+00	
00000000-0000-0000-0000-000000000000	71e8e3f9-1335-4004-b6f5-8147c1af7440	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 06:52:34.119267+00	
00000000-0000-0000-0000-000000000000	6a0758f8-c94c-4838-a476-47208cf13355	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 07:59:27.521965+00	
00000000-0000-0000-0000-000000000000	bd939223-19ba-4265-aa9f-fcdf0d1504c0	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 08:35:24.337933+00	
00000000-0000-0000-0000-000000000000	6365d46d-479f-415d-9d1a-2be0cfb11cf8	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-25 09:29:43.390518+00	
00000000-0000-0000-0000-000000000000	258a3c9d-d79d-4208-8bdc-18f26864616b	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-25 10:31:38.54639+00	
00000000-0000-0000-0000-000000000000	412e662b-c133-426b-953e-0a0dd088aed8	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 10:39:17.510018+00	
00000000-0000-0000-0000-000000000000	2b9631c2-e151-4430-b65a-5bedc4d0cf03	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-25 12:12:22.146039+00	
00000000-0000-0000-0000-000000000000	9a4191d5-2401-4faa-a637-ec122842c4ea	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 12:20:54.047533+00	
00000000-0000-0000-0000-000000000000	d2dec601-96d3-4002-b441-659bd1e8c236	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-25 13:10:19.327906+00	
00000000-0000-0000-0000-000000000000	19c7c1c8-4e6c-4b31-9348-de08fec2470a	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-25 13:12:30.527087+00	
00000000-0000-0000-0000-000000000000	fbe20ed0-de08-4294-be90-d5cc06679ff9	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 13:32:50.108561+00	
00000000-0000-0000-0000-000000000000	564252af-22dc-46b1-af3b-df514769ead7	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-25 14:11:20.460717+00	
00000000-0000-0000-0000-000000000000	c757ed05-4ee9-4c81-bb60-62c9020992a4	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-25 14:13:04.221155+00	
00000000-0000-0000-0000-000000000000	d1a767f5-15c1-45a6-bdb7-f0a76ef46751	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-25 15:13:35.225785+00	
00000000-0000-0000-0000-000000000000	5b3f59ef-323f-4401-b2ca-4f3355c0e92a	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-26 09:07:25.593814+00	
00000000-0000-0000-0000-000000000000	490cd001-ac55-4c6f-9830-7f193af69ae5	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-26 10:11:57.969221+00	
00000000-0000-0000-0000-000000000000	f3c0206a-707a-4108-9b98-c515f4fae71f	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-26 14:11:53.501854+00	
00000000-0000-0000-0000-000000000000	b3b25156-2e2f-405b-8826-48ef3a510299	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-26 15:42:31.294843+00	
00000000-0000-0000-0000-000000000000	6fb8679e-5b4d-414f-95ce-795b24a7ac12	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-27 08:44:09.997769+00	
00000000-0000-0000-0000-000000000000	830f0c91-1c72-4ddf-b8aa-2334392b5123	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-27 09:48:35.745566+00	
00000000-0000-0000-0000-000000000000	ee8c3560-f8c9-4fac-b127-98851b4c078a	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-27 10:48:39.571308+00	
00000000-0000-0000-0000-000000000000	ea6232c9-2524-4506-9d52-cd033793b3c8	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-27 13:51:23.861464+00	
00000000-0000-0000-0000-000000000000	5450f8b6-7b00-42f8-8055-faa8b53de228	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-27 13:51:29.00682+00	
00000000-0000-0000-0000-000000000000	d6b7d858-6e03-4923-a53a-28fc97d841b6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-28 08:35:32.41462+00	
00000000-0000-0000-0000-000000000000	2cb5b899-dfc6-4a3c-896f-64eeccdfebf6	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-28 09:50:58.202675+00	
00000000-0000-0000-0000-000000000000	e5196afd-a1e5-4fb6-9ccb-fecf0b6d6fa8	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-28 21:52:01.540047+00	
00000000-0000-0000-0000-000000000000	4e99d5f2-3555-40d7-ac9f-8b17be036a6a	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-28 22:52:26.289875+00	
00000000-0000-0000-0000-000000000000	3c2e97f6-a897-4641-a735-b333bc851256	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-28 23:54:54.241218+00	
00000000-0000-0000-0000-000000000000	d5fcde9d-55ee-42ee-8124-5ce7b876aa04	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-29 07:29:56.217296+00	
00000000-0000-0000-0000-000000000000	ca5639c1-767c-4fa9-b038-f3cd3b3f9f3e	{"action":"login","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-29 09:28:11.355092+00	
00000000-0000-0000-0000-000000000000	8156dde4-93c8-4150-9c9b-5867ad5045f3	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 12:55:39.899201+00	
00000000-0000-0000-0000-000000000000	a3c74559-4615-4ab3-9343-215fb4445a09	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-29 13:52:53.204534+00	
00000000-0000-0000-0000-000000000000	6237fd4e-ac5d-44fd-b319-fe76ef92cbf2	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 13:55:56.868477+00	
00000000-0000-0000-0000-000000000000	4790fc77-9cf7-4b25-9482-8a0c19f2925e	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 14:56:16.873497+00	
00000000-0000-0000-0000-000000000000	d8abb97a-9d53-413b-b0d8-915cd9d5ee7a	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-29 14:59:29.998126+00	
00000000-0000-0000-0000-000000000000	58e2f008-4412-476a-84e2-a3db031bc4ec	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 15:56:47.378681+00	
00000000-0000-0000-0000-000000000000	9f57f932-6853-4baf-b23b-b793bb9ca5e4	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 16:57:05.400559+00	
00000000-0000-0000-0000-000000000000	7d379a9c-83ee-42b3-b521-972aa4542f79	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 19:09:26.065855+00	
00000000-0000-0000-0000-000000000000	3dbad8b6-328a-426a-87ee-434c72900384	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 20:15:02.213331+00	
00000000-0000-0000-0000-000000000000	f2980cfe-0545-4a7a-8656-6ccc43488259	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 20:15:17.090814+00	
00000000-0000-0000-0000-000000000000	d2249fab-8a80-4bd6-b585-31eb14c6f100	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 21:24:24.673705+00	
00000000-0000-0000-0000-000000000000	872775a5-3660-46ce-a284-f697197030da	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-29 22:28:49.497963+00	
00000000-0000-0000-0000-000000000000	12b55af5-9c40-497c-bc68-5b3f5d3a7d84	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-30 08:12:37.490535+00	
00000000-0000-0000-0000-000000000000	b69c83dd-991f-47bd-bb07-aa0925a17267	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-30 09:27:29.035758+00	
00000000-0000-0000-0000-000000000000	65231a20-76b6-44e9-b7ad-9df5ff4185d4	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-30 09:40:06.684982+00	
00000000-0000-0000-0000-000000000000	2587641b-d497-4dff-b3f0-98b662804f9f	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-30 10:47:27.050273+00	
00000000-0000-0000-0000-000000000000	a39d0c63-283e-4342-a957-7f9336bc0ef1	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-30 13:01:53.083343+00	
00000000-0000-0000-0000-000000000000	5ad8f95f-95d8-487d-9ff4-d807eb503b8b	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-30 14:05:11.491664+00	
00000000-0000-0000-0000-000000000000	e0329aa3-0589-470c-9620-6129166035e4	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-30 14:19:55.960985+00	
00000000-0000-0000-0000-000000000000	3fd26557-50ab-46a8-a948-bb6ca003d93f	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-30 14:36:55.684293+00	
00000000-0000-0000-0000-000000000000	de6fcdc7-99fb-42ee-8139-e1f2f7117498	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-30 14:38:15.618811+00	
00000000-0000-0000-0000-000000000000	86bac85d-44e5-463c-b41e-3d1a702827f7	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-30 15:29:28.960937+00	
00000000-0000-0000-0000-000000000000	1f9ca3b7-4324-447b-b4d1-70d1c6567b6c	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-31 08:26:26.339817+00	
00000000-0000-0000-0000-000000000000	2368cf4d-a6a0-4e31-87d2-7683a7c8c38a	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-31 09:28:11.946363+00	
00000000-0000-0000-0000-000000000000	0df04949-f63f-4938-9bbf-15526033b006	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-31 10:09:13.591877+00	
00000000-0000-0000-0000-000000000000	173423f1-fecb-4aa2-95bd-431ffc8c5bca	{"action":"login","actor_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","actor_username":"janine@fankhauser.cc","log_type":"account","traits":{"provider":"email"}}	2024-01-31 10:28:30.279548+00	
00000000-0000-0000-0000-000000000000	4f5aba2b-7785-423c-998e-fc9ab3a66434	{"action":"login","actor_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","actor_username":"jufrlke@bluewin.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-31 11:06:48.446757+00	
00000000-0000-0000-0000-000000000000	3942c782-f867-4f25-843e-f769d9120660	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-31 12:41:22.510847+00	
00000000-0000-0000-0000-000000000000	70d1cdf0-1b3a-4c69-a278-362e0c30a867	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-31 13:29:54.715268+00	
00000000-0000-0000-0000-000000000000	601d9e56-b425-4596-9874-c45a987a1934	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-31 13:49:19.16057+00	
00000000-0000-0000-0000-000000000000	67497ae5-318c-4233-8b67-b918862a0395	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-31 14:31:47.104819+00	
00000000-0000-0000-0000-000000000000	e5eb25bb-bd3d-4354-a81c-c9c796a76af9	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-01-31 15:11:22.135464+00	
00000000-0000-0000-0000-000000000000	08d0e0ae-145e-473d-bb5f-25f5d0bb34d6	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-31 15:32:03.862823+00	
00000000-0000-0000-0000-000000000000	decbcb14-dd31-43c8-974e-44ad64a0f182	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-31 20:16:56.129046+00	
00000000-0000-0000-0000-000000000000	b15d5f55-4b8e-47cc-b27a-ee748dc318dc	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-31 21:18:33.648112+00	
00000000-0000-0000-0000-000000000000	fda5fa47-5e14-406c-b21f-610f1aa50067	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-01-31 22:19:09.934283+00	
00000000-0000-0000-0000-000000000000	b6622e70-61f5-4eef-9748-d4887f967e8e	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 06:59:44.376123+00	
00000000-0000-0000-0000-000000000000	23af4b5d-fedc-4dbd-aa50-d2af704e10c7	{"action":"login","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 07:26:18.96605+00	
00000000-0000-0000-0000-000000000000	b3929df2-f928-4741-a052-0383e78c0397	{"action":"login","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 09:02:50.843053+00	
00000000-0000-0000-0000-000000000000	8be61816-651c-49ef-8ea1-de2ef05e9dbd	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 09:48:29.359852+00	
00000000-0000-0000-0000-000000000000	1f019586-1ea7-40a8-b498-82ad27060276	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 10:03:58.009084+00	
00000000-0000-0000-0000-000000000000	2966f709-9d2c-48a0-9c53-3ff33682acd5	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 12:07:57.440043+00	
00000000-0000-0000-0000-000000000000	5de1d13d-b769-47e0-a302-68d63251f203	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 12:34:39.627922+00	
00000000-0000-0000-0000-000000000000	0b29dcae-5465-4efb-a669-8158425c4b7a	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 13:30:46.912343+00	
00000000-0000-0000-0000-000000000000	f9968e9a-66eb-440a-b656-fc722b562de8	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-01 14:56:16.810114+00	
00000000-0000-0000-0000-000000000000	05f8c712-1191-4fc0-8504-4ac2c279b722	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 08:27:18.28978+00	
00000000-0000-0000-0000-000000000000	a79dd55a-50d4-4060-a1f7-6df9b8315aa7	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 08:30:54.254184+00	
00000000-0000-0000-0000-000000000000	a476c98a-0367-4091-940f-af308c26765d	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-02-02 08:54:14.371836+00	
00000000-0000-0000-0000-000000000000	6c37c1c4-2352-407a-838b-5e335b46ba54	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 10:03:40.915444+00	
00000000-0000-0000-0000-000000000000	2dc0d186-5d9d-4a13-81db-53534a2f6f92	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 11:04:56.443431+00	
00000000-0000-0000-0000-000000000000	438078f8-b5d0-461f-bff4-c6822be81621	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 12:25:18.862856+00	
00000000-0000-0000-0000-000000000000	edbab8dd-7636-46cb-a4c5-e5cbcbf15e77	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 13:31:05.616354+00	
00000000-0000-0000-0000-000000000000	faff9476-bef2-426c-9728-17752f207437	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 14:36:37.044744+00	
00000000-0000-0000-0000-000000000000	7647eb3e-1d50-4208-89ad-52116047f40a	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-02 15:43:14.265266+00	
00000000-0000-0000-0000-000000000000	942054ac-55eb-4658-b601-4f9a3642fe02	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-02-02 16:12:26.53035+00	
00000000-0000-0000-0000-000000000000	20870a99-5c1a-4af7-ae0f-3b346200a424	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 08:17:09.018216+00	
00000000-0000-0000-0000-000000000000	18457058-b12b-4383-a4c5-257df05cc5fc	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 09:17:12.730378+00	
00000000-0000-0000-0000-000000000000	246fe2ca-9da4-4f4e-9c07-5f53e7f2d39a	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 10:17:24.021647+00	
00000000-0000-0000-0000-000000000000	3d386ff0-fe11-4d9a-b1c1-3c04a54fb5a6	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 12:02:22.050343+00	
00000000-0000-0000-0000-000000000000	03a3f28e-4bb1-49bf-be81-81d3a8ad5c83	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 14:35:11.596331+00	
00000000-0000-0000-0000-000000000000	c394ce70-b5a8-45b6-a5bc-b0fe6b6db4fc	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 14:39:48.797035+00	
00000000-0000-0000-0000-000000000000	c88f8b1b-fd2b-4d03-937c-f312bb45fa71	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-05 15:49:21.189241+00	
00000000-0000-0000-0000-000000000000	938716e0-ac7e-46e5-95e5-ff8d9db00ac4	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-05 16:40:01.386841+00	
00000000-0000-0000-0000-000000000000	93ec4c9f-74ee-4a2b-89ac-a34dac4fab29	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 07:44:24.080247+00	
00000000-0000-0000-0000-000000000000	01e61686-07f9-4bb8-a63e-e8c235a72189	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 08:19:45.69301+00	
00000000-0000-0000-0000-000000000000	3d9fb3ca-abb2-472a-87d0-0e3f48abb8a5	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 09:01:19.995627+00	
00000000-0000-0000-0000-000000000000	d54d9e9c-4480-49f8-bbab-f808a9e5872d	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 09:07:44.763689+00	
00000000-0000-0000-0000-000000000000	c5bbf4a5-b88b-4511-8127-1c67d5913d29	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 09:20:34.806102+00	
00000000-0000-0000-0000-000000000000	baa56c71-9caa-4299-8f2c-b42486e9cc31	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 10:09:31.736732+00	
00000000-0000-0000-0000-000000000000	4f66dc23-2fd7-429b-9ebb-6386f9ac0e66	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-02-06 10:25:44.721592+00	
00000000-0000-0000-0000-000000000000	163af5ea-2c58-427a-9bbf-2746c61e9bdf	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 12:24:24.497122+00	
00000000-0000-0000-0000-000000000000	11392863-0564-4fef-aef5-86d45779df79	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-02-06 12:41:17.095794+00	
00000000-0000-0000-0000-000000000000	38ce19fd-6223-4d54-926f-734cb9ce5a29	{"action":"login","actor_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","actor_username":"l.sergi@live.com","log_type":"account","traits":{"provider":"email"}}	2024-02-06 13:42:04.595407+00	
00000000-0000-0000-0000-000000000000	1ab6b296-ea10-46f9-99be-9df5e105d149	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 13:54:01.540127+00	
00000000-0000-0000-0000-000000000000	57c9139e-8203-4211-b2de-8638c2b02334	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-06 15:23:14.695599+00	
00000000-0000-0000-0000-000000000000	e54c52f7-c95e-4823-91ab-0daf143e2c8d	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 07:32:50.440618+00	
00000000-0000-0000-0000-000000000000	494c8dd3-b8e9-4df8-acf6-8cf5cfc5ab47	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 08:00:34.55218+00	
00000000-0000-0000-0000-000000000000	d827e829-946d-4a08-a7b6-360892727c6d	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 08:54:07.125372+00	
00000000-0000-0000-0000-000000000000	41ed240b-4b0b-4a21-8fa1-4389f1849704	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 09:54:38.122218+00	
00000000-0000-0000-0000-000000000000	7dbd7a18-a03a-43cb-b559-c1423fd81310	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-02-07 10:05:12.682974+00	
00000000-0000-0000-0000-000000000000	acd8420e-6e5d-4be1-943b-436a54fa49df	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 10:12:33.362733+00	
00000000-0000-0000-0000-000000000000	bd45b84b-ead7-45ea-91bb-8bf00d6732f8	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 10:57:43.062231+00	
00000000-0000-0000-0000-000000000000	99790bc1-9bf1-49b5-a099-9197341f6e0b	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 12:01:56.644266+00	
00000000-0000-0000-0000-000000000000	44b75a6e-248e-4474-99c5-234da4da1304	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 12:21:38.947323+00	
00000000-0000-0000-0000-000000000000	70ffac18-7a98-45ed-ab61-acfa6fa51945	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 13:59:30.645814+00	
00000000-0000-0000-0000-000000000000	01d7b963-a527-4c09-83fe-1e2dec88a4b1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 15:35:03.227829+00	
00000000-0000-0000-0000-000000000000	703d5e67-ab24-4e1b-97f8-d950d1b9b09f	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-07 15:37:45.431615+00	
00000000-0000-0000-0000-000000000000	a0317208-699c-4c5c-a1a0-3149187278ba	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 15:37:55.567471+00	
00000000-0000-0000-0000-000000000000	0157b027-7367-4e56-b81c-e5cfe22b0274	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-07 15:38:05.322846+00	
00000000-0000-0000-0000-000000000000	21c8320b-7a54-4dcc-92a5-2174500a27d5	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 15:57:07.407208+00	
00000000-0000-0000-0000-000000000000	9eb57cf3-ecbb-414f-bc63-fdb79a6bbc3f	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-07 17:06:22.452094+00	
00000000-0000-0000-0000-000000000000	33f3a58e-7b81-4c09-a0cc-f8c3be8bec31	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 09:02:36.493496+00	
00000000-0000-0000-0000-000000000000	4ded9fd3-3585-4ecf-b291-3daeae73504f	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 09:20:11.245384+00	
00000000-0000-0000-0000-000000000000	df6e34e2-aeb8-444a-85a3-00494cf6acbd	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 09:42:10.857093+00	
00000000-0000-0000-0000-000000000000	5197a443-fe13-4256-82ef-7d4fd26b1026	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 10:18:17.731475+00	
00000000-0000-0000-0000-000000000000	3d94b9a1-e258-4ea0-bfeb-20c003add5c6	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 10:23:47.038459+00	
00000000-0000-0000-0000-000000000000	ee9a83ee-594f-4d14-a707-c1da6778d03a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 11:59:28.407661+00	
00000000-0000-0000-0000-000000000000	654c4f18-35c7-465d-bfcf-a67edc28c16d	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 12:34:05.893735+00	
00000000-0000-0000-0000-000000000000	b2760df4-7d39-407c-b2ea-16d763aea8d8	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 12:49:22.539065+00	
00000000-0000-0000-0000-000000000000	b5e938be-b3d0-4ef3-8a1d-a07d12f3c862	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 13:51:58.233558+00	
00000000-0000-0000-0000-000000000000	5a4fc2b8-bb87-4bbd-ae91-be25ea59d575	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 14:25:19.862529+00	
00000000-0000-0000-0000-000000000000	b0d42452-2b1d-403f-b481-34e277f4d084	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-08 15:25:38.010523+00	
00000000-0000-0000-0000-000000000000	109e43ed-ce21-4fd9-9e3c-0242903356c2	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-08 16:11:57.87526+00	
00000000-0000-0000-0000-000000000000	9b249560-47d8-41df-8cff-cad34c927cfb	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 07:18:48.070631+00	
00000000-0000-0000-0000-000000000000	5a7b0f94-3d4d-47c5-9eba-1a814478c1d0	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 08:45:55.402719+00	
00000000-0000-0000-0000-000000000000	7085e3b6-80be-4d45-9e5c-aca1cc40f46d	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 10:52:36.946303+00	
00000000-0000-0000-0000-000000000000	3c559f38-2abf-4d61-b97a-28582789bcb2	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 12:21:26.594963+00	
00000000-0000-0000-0000-000000000000	f92631a8-b181-4ae9-af4c-5313f346e54e	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 13:25:33.382929+00	
00000000-0000-0000-0000-000000000000	bc8912c8-9a1e-4cf6-8b72-ffa74e4307a8	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 15:04:38.63622+00	
00000000-0000-0000-0000-000000000000	365537ef-828a-4343-8a1b-8f3a7cb9f571	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-09 15:19:54.001015+00	
00000000-0000-0000-0000-000000000000	174f707d-7bc2-4263-a786-759b9d3266d1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 07:22:47.94993+00	
00000000-0000-0000-0000-000000000000	154c1754-a77b-4292-a27e-1c3b680b9dbb	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 08:29:00.690331+00	
00000000-0000-0000-0000-000000000000	c7a97526-371a-405f-b949-354c6f05c0de	{"action":"login","actor_id":"0f263b32-fad7-4b16-be21-370b63cb7797","actor_username":"rafael.brunner@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 09:02:55.284162+00	
00000000-0000-0000-0000-000000000000	5d99527d-8ab5-4069-8c74-af50cf746e07	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 09:21:54.169776+00	
00000000-0000-0000-0000-000000000000	8b35825f-fbbc-4634-8657-f584ac1d3633	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 12:38:48.063549+00	
00000000-0000-0000-0000-000000000000	0ca3459c-dc55-41a0-afd4-1de6a850324a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 13:56:21.78097+00	
00000000-0000-0000-0000-000000000000	42e8e45c-bf32-466b-aee8-e2c1301ed623	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-12 15:27:01.07773+00	
00000000-0000-0000-0000-000000000000	c107f949-7f3e-419d-95e2-08f1f78c4517	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 09:18:07.904242+00	
00000000-0000-0000-0000-000000000000	0b0d4021-09da-459b-bfbf-8a12f6437401	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 09:20:54.520744+00	
00000000-0000-0000-0000-000000000000	6810817e-68c0-47b2-bfa3-1e85ca6f673e	{"action":"login","actor_id":"ef2ccc58-d6ef-4af7-a456-858a39200ebd","actor_username":"philip.wehrens@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 09:47:54.658913+00	
00000000-0000-0000-0000-000000000000	3c41f88f-30af-49b1-a62d-940510df6f45	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 10:22:22.572709+00	
00000000-0000-0000-0000-000000000000	34868ce1-bbf0-4c93-a8c5-037dc2d0480d	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 12:25:27.912239+00	
00000000-0000-0000-0000-000000000000	0918670a-c343-4298-9190-382f865634fc	{"action":"login","actor_id":"356537c3-fb03-44f4-8e81-7871ad36760f","actor_username":"nils.oesterling@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 13:54:25.51343+00	
00000000-0000-0000-0000-000000000000	9e69dfae-f060-4eef-8f35-2a62c3dc1824	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 14:45:52.817917+00	
00000000-0000-0000-0000-000000000000	da5b8ed0-2fa1-4157-ba78-969a292e848a	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 15:49:01.839252+00	
00000000-0000-0000-0000-000000000000	b1dfb415-849d-4ac7-8bc9-0c5e1e630f57	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-13 15:49:14.322199+00	
00000000-0000-0000-0000-000000000000	fb33a1cc-04d8-4a2a-9617-d4b319ccd4d1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 15:49:16.672463+00	
00000000-0000-0000-0000-000000000000	e38915d0-57b9-487d-b088-fd045eb98562	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-13 16:05:39.901079+00	
00000000-0000-0000-0000-000000000000	a6da89f2-fa03-4921-b18d-706e6dca4dc7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-13 16:05:54.06664+00	
00000000-0000-0000-0000-000000000000	41ae0a7c-ec5d-47b5-86fa-0cc98e6db158	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-13 17:02:28.517292+00	
00000000-0000-0000-0000-000000000000	449206c8-edc4-4db2-b05b-e38eae843f9c	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 07:03:51.003895+00	
00000000-0000-0000-0000-000000000000	fa4155ad-b13f-4d83-a034-8d0e0cde40cc	{"action":"login","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 08:45:36.978055+00	
00000000-0000-0000-0000-000000000000	da618672-8a14-4c7c-90d0-6f9751645a95	{"action":"logout","actor_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","actor_username":"milan.beres@swisstopo.ch","log_type":"account"}	2024-02-14 09:36:00.42203+00	
00000000-0000-0000-0000-000000000000	a25e610c-8924-41c3-9668-7517b94802e3	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 09:38:09.124594+00	
00000000-0000-0000-0000-000000000000	68206040-6eca-494b-b341-c61e97913ec9	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-14 10:19:29.348942+00	
00000000-0000-0000-0000-000000000000	7c8853c9-e9a4-4d46-98c8-1f01d435b0ef	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 10:19:40.748853+00	
00000000-0000-0000-0000-000000000000	c4526d87-794d-44af-a776-4e79483978dd	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 12:18:15.528095+00	
00000000-0000-0000-0000-000000000000	f37b996f-b312-4563-b2f2-c5f440ff71e1	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 13:18:18.967928+00	
00000000-0000-0000-0000-000000000000	02e2a2ad-f6a0-4683-be0d-a50b96d7a037	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 14:26:17.88058+00	
00000000-0000-0000-0000-000000000000	962fcd02-b885-4cee-8346-0c1edf28fa68	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-14 15:44:01.050891+00	
00000000-0000-0000-0000-000000000000	3830856f-05c9-4d4d-adae-7192fa11fe0e	{"action":"logout","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account"}	2024-02-14 16:26:58.823823+00	
00000000-0000-0000-0000-000000000000	3756a1af-04dc-43ce-97b5-9ed88ed53346	{"action":"login","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-15 10:00:20.775699+00	
00000000-0000-0000-0000-000000000000	9988d7d2-4800-4beb-893a-3f32dd07b7b9	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-15 10:03:11.68496+00	
00000000-0000-0000-0000-000000000000	7bca5f35-478b-482d-be43-ee1cf441582f	{"action":"login","actor_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","actor_username":"stijn.vermeeren@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-15 10:12:53.020755+00	
00000000-0000-0000-0000-000000000000	328b281a-4ec2-4d99-882f-6eb94fd7d9e7	{"action":"login","actor_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","actor_username":"marcel.pfiffner@swisstopo.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-15 12:26:27.236566+00	
00000000-0000-0000-0000-000000000000	3f2d537b-b0a4-4355-a193-b6f76b6beaee	{"action":"login","actor_id":"ce2e99bc-2128-42df-b31f-55f2c035e2df","actor_username":"alex.graf@ebp.ch","log_type":"account","traits":{"provider":"email"}}	2024-02-15 16:22:36.381376+00	
00000000-0000-0000-0000-000000000000	4842e133-e8c0-4824-adb4-234864cef7a6	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"alain.morard@swisstopo.ch","user_id":"704d43de-7fd6-48b2-bbac-ff661132144e","user_phone":""}}	2024-02-15 16:23:16.865119+00	
00000000-0000-0000-0000-000000000000	4cbb62fb-56cc-44e6-a40c-267db923f81d	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"andreas.moeri@swisstopo.ch","user_id":"5ae4e2f6-8bac-4eac-90e0-d510fad92f5c","user_phone":""}}	2024-02-15 16:23:23.909089+00	
00000000-0000-0000-0000-000000000000	d291dabd-dab8-4221-aacb-106fb24894e2	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"anina.ursprung@swisstopo.ch","user_id":"b1cc6265-a789-46c0-ba9f-dd2ad47e878d","user_phone":""}}	2024-02-15 16:23:27.760085+00	
00000000-0000-0000-0000-000000000000	db64fca4-a73f-4a43-8a5a-a6807d7dbe90	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"christian.ansorge@swisstopo.ch","user_id":"423ec6d6-9187-4802-b5da-6372d97e9053","user_phone":""}}	2024-02-15 16:23:32.848842+00	
00000000-0000-0000-0000-000000000000	7da2cec5-90fb-4433-b17a-03ceef9ab724	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"christophe.nussbaum@swisstopo.ch","user_id":"d4ba8c9a-ca08-4d55-a928-4892f5cb5e6d","user_phone":""}}	2024-02-15 16:23:36.824797+00	
00000000-0000-0000-0000-000000000000	380d46df-3f31-42b0-a052-1260936599cd	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"claire.epiney@swisstopo.ch","user_id":"1ccb8ecf-3d81-4864-b008-879a89a74ed1","user_phone":""}}	2024-02-15 16:23:40.488804+00	
00000000-0000-0000-0000-000000000000	dbba58ea-75c8-441a-ab1b-cc5088ad58a1	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"daniel.gechter@swisstopo.ch","user_id":"afe4b578-1ae4-4bbf-a595-b2c2789a77b4","user_phone":""}}	2024-02-15 16:23:44.420587+00	
00000000-0000-0000-0000-000000000000	dadf2a23-dc7f-4ec2-a4cd-907c8b2ebec8	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"daniel.jovanovic@geowerkstatt.ch","user_id":"ec61575d-322c-48ae-80c3-f9b2d9b4ce80","user_phone":""}}	2024-02-15 16:23:47.952496+00	
00000000-0000-0000-0000-000000000000	fa731074-7d28-4c83-9a8a-b2938462b990	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"daniel.kaelin@swisstopo.ch","user_id":"05b83aa4-1715-4ad1-abfd-dba964b81f27","user_phone":""}}	2024-02-15 16:23:53.133738+00	
00000000-0000-0000-0000-000000000000	a8088d8c-1f91-4026-a074-220470bbca06	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"david.jaeggi@swisstopo.ch","user_id":"d6715729-84ff-444b-9805-2f64ce9ed513","user_phone":""}}	2024-02-15 16:23:57.520853+00	
00000000-0000-0000-0000-000000000000	ba34df93-2b72-4cfd-adeb-f6b410b157ed	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"eva.kurmann@swisstopo.ch","user_id":"b934b581-90e9-41ba-af3f-73692f65f095","user_phone":""}}	2024-02-15 16:24:00.99361+00	
00000000-0000-0000-0000-000000000000	2369a4e2-05a2-4cd5-ae57-303043347bad	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"ferdinando.mussopiantelli@swisstopo.ch","user_id":"ce286136-6622-4f3c-8f20-bdd27dd2c6ca","user_phone":""}}	2024-02-15 16:24:03.932543+00	
00000000-0000-0000-0000-000000000000	a90b317f-5e20-4fe8-95ff-034c23b3d689	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"herfried.madritsch@swisstopo.ch","user_id":"b66fde4d-a6f4-4c7e-8617-c26429562e4d","user_phone":""}}	2024-02-15 16:24:07.192648+00	
00000000-0000-0000-0000-000000000000	d9c11c9f-9c0d-4cd9-adad-86da4e306cc2	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"janine@fankhauser.cc","user_id":"5c2fa081-a226-4ed1-ab79-0945295b6026","user_phone":""}}	2024-02-15 16:24:11.027222+00	
00000000-0000-0000-0000-000000000000	8cd43322-de89-47d4-a48e-9e2af7fc3b31	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"jufrlke@bluewin.ch","user_id":"d212b9ce-3c27-4b73-a55f-cf6a82894139","user_phone":""}}	2024-02-15 16:24:14.422422+00	
00000000-0000-0000-0000-000000000000	1bee930a-38bd-470a-ac7a-00f4e5ff1b9c	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"l.sergi@live.com","user_id":"f8dc6800-6923-46b4-bb8a-77f93502e7bc","user_phone":""}}	2024-02-15 16:24:17.328943+00	
00000000-0000-0000-0000-000000000000	e0832ad2-365c-4bbe-a6ac-91259de7d34b	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"lance.reynolds@swisstopo.ch","user_id":"442cd562-309d-4e58-879b-2abf7d5dbee9","user_phone":""}}	2024-02-15 16:24:20.416644+00	
00000000-0000-0000-0000-000000000000	897f7d79-1480-4f1a-b24c-476bc40f2181	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"laurent.scheurer@swisstopo.ch","user_id":"0a4d7141-2f02-4f1a-8df1-5494ce81916c","user_phone":""}}	2024-02-15 16:24:24.101468+00	
00000000-0000-0000-0000-000000000000	98ec342c-a756-456a-94ba-af97fbcf049c	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"laurent.thum@swisstopo.ch","user_id":"d128758c-c2ea-406d-99f8-4568706ba91e","user_phone":""}}	2024-02-15 16:24:27.187475+00	
00000000-0000-0000-0000-000000000000	da8a7817-487d-4033-ba06-66cfaaf26149	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"leonora.lehmann@bluewin.ch","user_id":"b1e36c73-19cc-40c1-9fb6-5a8d757aaf39","user_phone":""}}	2024-02-15 16:24:30.196723+00	
00000000-0000-0000-0000-000000000000	5918e11b-fe46-462f-9a50-928736a9d1a1	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"marc.monnerat@swisstopo.ch","user_id":"c78ef091-20e0-469d-924c-c3965d0a627b","user_phone":""}}	2024-02-15 16:24:32.766049+00	
00000000-0000-0000-0000-000000000000	1f259700-9828-463e-ad81-daac448bd543	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"marcel.pfiffner@swisstopo.ch","user_id":"48aab4f5-ca7b-4cca-b897-67c46f29c36b","user_phone":""}}	2024-02-15 16:24:36.01031+00	
00000000-0000-0000-0000-000000000000	870d65c7-8925-4225-ad90-93dead4458ad	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"matthias.baldi@lambda-it.ch","user_id":"1e10efef-b0fa-451a-8887-68af4003f8e0","user_phone":""}}	2024-02-15 16:24:39.02118+00	
00000000-0000-0000-0000-000000000000	6c09617a-e05d-48af-bd10-8cb281b3f76f	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"michael.gysi@swisstopo.ch","user_id":"9568c612-a0b9-44c5-8836-513234d53409","user_phone":""}}	2024-02-15 16:24:42.074866+00	
00000000-0000-0000-0000-000000000000	72d7ed2d-f295-42a2-8489-b7645cb07289	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"oliver.kempf@swisstopo.ch","user_id":"ad79ba6c-2fc8-4f72-a4e1-05240939d595","user_phone":""}}	2024-02-15 16:24:47.112178+00	
00000000-0000-0000-0000-000000000000	b0c737dd-4caf-4002-9397-e201c71fafa7	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nils.oesterling@swisstopo.ch","user_id":"356537c3-fb03-44f4-8e81-7871ad36760f","user_phone":""}}	2024-02-15 16:24:49.902661+00	
00000000-0000-0000-0000-000000000000	a1d467d3-eebb-48a1-a1e3-35ba6dcd8a3d	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"peter.hayoz@swisstopo.ch","user_id":"a5c53661-4d09-4805-9190-0a66a7407d31","user_phone":""}}	2024-02-15 16:24:55.3821+00	
00000000-0000-0000-0000-000000000000	92dc05ab-52c0-4f30-ba76-cf00f1ab9110	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"pauline.baland@swisstopo.ch","user_id":"1995e110-98cb-4a27-9bb4-84734b8dd102","user_phone":""}}	2024-02-15 16:24:58.496106+00	
00000000-0000-0000-0000-000000000000	d3323a5f-55c6-4629-a499-61f5c80b3c27	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"pfifi@bluewin.ch","user_id":"f4814347-170c-409f-843b-5beca908fb03","user_phone":""}}	2024-02-15 16:25:01.637611+00	
00000000-0000-0000-0000-000000000000	121cf5c0-b8e1-42ff-8cce-4779e4cb7b33	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"nathalie.andenmattenberthoud@swisstopo.ch","user_id":"53721208-8733-4dce-a7de-20fcc53a2eaf","user_phone":""}}	2024-02-15 16:25:05.587237+00	
00000000-0000-0000-0000-000000000000	7a1670be-8a3e-47d1-b3fd-1fb0b564eef2	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"philip.wehrens@swisstopo.ch","user_id":"ef2ccc58-d6ef-4af7-a456-858a39200ebd","user_phone":""}}	2024-02-15 16:25:09.779985+00	
00000000-0000-0000-0000-000000000000	c80e9072-0a8f-4505-99ef-adabd97bbc4b	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"rafael.brunner@ebp.ch","user_id":"0f263b32-fad7-4b16-be21-370b63cb7797","user_phone":""}}	2024-02-15 16:25:12.614841+00	
00000000-0000-0000-0000-000000000000	87b524eb-6e86-45f4-9b91-546b5b8d836c	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"reto.burkhalter@swisstopo.ch","user_id":"eee9d0d2-7d6e-450d-8b0d-581ba19141c9","user_phone":""}}	2024-02-15 16:25:15.610832+00	
00000000-0000-0000-0000-000000000000	6b9911f6-2458-421b-9090-54a0d5b79a2b	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"robin.allenbach@swisstopo.ch","user_id":"668c355c-6d5f-4a11-8ffe-655910c60e37","user_phone":""}}	2024-02-15 16:25:18.901152+00	
00000000-0000-0000-0000-000000000000	5fca854c-130b-4cdf-90f8-d2a97019ca63	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"milenarose.scrignari@swisstopo.ch","user_id":"5f91ce96-defb-4f1f-9c30-655773f11494","user_phone":""}}	2024-02-15 16:25:22.517566+00	
00000000-0000-0000-0000-000000000000	6e23d43b-be8b-4f0a-b127-b605a1eb0a59	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"salome.signer@swisstopo.ch","user_id":"052bba0f-4e48-4802-b1c6-db8f496c3d0f","user_phone":""}}	2024-02-15 16:25:32.377065+00	
00000000-0000-0000-0000-000000000000	977b43a1-ed1e-4535-a2ea-55dc6ebf861a	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"sandrine.vallin@swisstopo.ch","user_id":"6c694c4e-0cbe-479f-93de-126dd9ac95a9","user_phone":""}}	2024-02-15 16:25:35.601561+00	
00000000-0000-0000-0000-000000000000	ac3a9299-d2d2-47cc-9815-3727c57c4a81	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"roland.baumberger@swisstopo.ch","user_id":"6b96221f-4b78-4d4a-82c4-3afb64233abd","user_phone":""}}	2024-02-15 16:25:38.308608+00	
00000000-0000-0000-0000-000000000000	cd3b3d9b-f44e-45dd-a577-04b9da30ce87	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"senecio.schefer@swisstopo.ch","user_id":"e305338c-ae72-41ed-9cf9-4487db86b1d4","user_phone":""}}	2024-02-15 16:25:41.152871+00	
00000000-0000-0000-0000-000000000000	4a2d892a-7adb-45e0-a2a6-884858eb3c35	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stefan.strasky@swisstopo.ch","user_id":"06ff93e5-b026-4efc-a899-be2bd33487d2","user_phone":""}}	2024-02-15 16:25:44.567721+00	
00000000-0000-0000-0000-000000000000	7c18b256-b4bc-47ed-873b-3ffe21209cba	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stijn.vermeeren@swisstopo.ch","user_id":"cea2655a-0fc8-4b27-94ad-1a7fc556e56b","user_phone":""}}	2024-02-15 16:25:49.900556+00	
00000000-0000-0000-0000-000000000000	c26ec051-fb02-4af3-8e9a-2daddd6efb92	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"michael.wiederkehr@swisstopo.ch","user_id":"da752d9c-a284-4954-90cf-5479d4f70b8f","user_phone":""}}	2024-02-15 16:26:05.177274+00	
00000000-0000-0000-0000-000000000000	ef256946-2951-4837-b796-e482d830a769	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"milan.beres@swisstopo.ch","user_id":"67a54714-64a4-4684-bf8e-0d524fa3256f","user_phone":""}}	2024-02-15 16:26:09.956871+00	
00000000-0000-0000-0000-000000000000	460f1aa1-75a1-4890-a5d7-7f4140aef8ab	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stefan.volken@swisstopo.ch","user_id":"ce61cac2-364a-4d66-8f93-0b25ba769729","user_phone":""}}	2024-02-15 16:26:13.480287+00	
00000000-0000-0000-0000-000000000000	f754684c-8a38-453d-871b-605439661df4	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"thomas.galfetti@swisstopo.ch","user_id":"8ca7983a-d1f3-4e8a-be00-af7a24b0f66b","user_phone":""}}	2024-02-15 16:26:17.443784+00	
00000000-0000-0000-0000-000000000000	f9424882-01bc-4c02-a51f-d00f42815472	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"wayne.maurer@lambda-it.ch","user_id":"ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a","user_phone":""}}	2024-02-15 16:26:22.274224+00	
00000000-0000-0000-0000-000000000000	82eb3029-5792-4ba5-b856-b6224b43364b	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"yves.gouffon@swisstopo.ch","user_id":"2c14f694-9727-4a00-82ba-ffe95995daba","user_phone":""}}	2024-02-15 16:26:29.324761+00	
00000000-0000-0000-0000-000000000000	09789b0a-6a99-4254-98cc-35ad17226510	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"stephan.dallagnolo@swisstopo.ch","user_id":"3ddc99b1-a269-49a8-a693-c0fd68d39a20","user_phone":""}}	2024-02-15 16:26:34.314277+00	
00000000-0000-0000-0000-000000000000	109d623d-d2a2-4e45-bd2f-9fb3adc44f93	{"action":"user_invited","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","log_type":"team","traits":{"user_email":"admin@assets.sg","user_id":"10f95aa3-fb95-41eb-b754-5f729a092e30"}}	2024-02-15 16:27:23.05631+00	
00000000-0000-0000-0000-000000000000	4bc89a49-d18a-412d-8388-f04c540742d8	{"action":"user_signedup","actor_id":"10f95aa3-fb95-41eb-b754-5f729a092e30","actor_username":"admin@assets.sg","log_type":"team"}	2024-02-15 16:28:47.223385+00	
00000000-0000-0000-0000-000000000000	8c65d78f-4d8b-4c87-9423-65967e8aeab3	{"action":"user_recovery_requested","actor_id":"10f95aa3-fb95-41eb-b754-5f729a092e30","actor_username":"admin@assets.sg","log_type":"user"}	2024-02-15 16:30:33.657416+00	
00000000-0000-0000-0000-000000000000	2d223a5a-6413-460b-8a52-bab9ae1dd097	{"action":"login","actor_id":"10f95aa3-fb95-41eb-b754-5f729a092e30","actor_username":"admin@assets.sg","log_type":"account"}	2024-02-15 16:30:43.111687+00	
00000000-0000-0000-0000-000000000000	690d955b-f749-4912-a892-5affb5e91903	{"action":"user_modified","actor_id":"10f95aa3-fb95-41eb-b754-5f729a092e30","actor_username":"admin@assets.sg","log_type":"user"}	2024-02-15 16:31:09.400055+00	
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
00000000-0000-0000-0000-000000000000	83	8p_cFveCKnDTuV1YV8Ri1A	9568c612-a0b9-44c5-8836-513234d53409	f	2023-07-17 11:44:33.657232+00	2023-07-17 11:44:33.657236+00	\N
00000000-0000-0000-0000-000000000000	84	Ryt-Ut8jEDX6YBk7spLcyQ	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-07-17 12:02:00.320624+00	2023-07-17 12:02:00.32063+00	\N
00000000-0000-0000-0000-000000000000	334	zF_vKJ1rFplSKfpM0AemsA	c78ef091-20e0-469d-924c-c3965d0a627b	f	2023-09-13 07:00:13.116909+00	2023-09-13 07:00:13.116913+00	\N
00000000-0000-0000-0000-000000000000	240	2_3MbngAeDhdijyES9SZoA	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-08-28 12:32:50.261965+00	2023-08-28 12:32:50.26197+00	\N
00000000-0000-0000-0000-000000000000	87	6Wra1-0Q8U8PwV68dXJkSQ	1e10efef-b0fa-451a-8887-68af4003f8e0	f	2023-07-17 12:14:43.491827+00	2023-07-17 12:14:43.491831+00	\N
00000000-0000-0000-0000-000000000000	335	oLs57HsTPsJAE6Z-mkGKQQ	c78ef091-20e0-469d-924c-c3965d0a627b	f	2023-09-13 07:00:23.434693+00	2023-09-13 07:00:23.434697+00	\N
00000000-0000-0000-0000-000000000000	336	17Bi3Qc9EM8vaQeOylMbfA	c78ef091-20e0-469d-924c-c3965d0a627b	f	2023-09-13 07:00:38.351504+00	2023-09-13 07:00:38.351508+00	\N
00000000-0000-0000-0000-000000000000	337	x_txdFlCiJA3mF4mLQgV3A	83fc2446-4132-4a83-b6dd-7d117cceed26	f	2023-09-13 07:02:56.32154+00	2023-09-13 07:02:56.321544+00	\N
00000000-0000-0000-0000-000000000000	339	fdOWfQrKqdq-V3f0ORGBOw	2c14f694-9727-4a00-82ba-ffe95995daba	f	2023-09-13 07:28:38.215075+00	2023-09-13 07:28:38.215079+00	\N
00000000-0000-0000-0000-000000000000	246	-ymW33kiV6lCX47cGhkF4A	f4814347-170c-409f-843b-5beca908fb03	f	2023-08-29 09:19:45.255607+00	2023-08-29 09:19:45.255611+00	\N
00000000-0000-0000-0000-000000000000	13	YGNuUdhifCG8EG1WM3rReQ	3f6376cd-56a3-4938-aabf-5d81f320b0cc	f	2023-05-31 11:24:45.500414+00	2023-05-31 11:24:45.500417+00	\N
00000000-0000-0000-0000-000000000000	14	3TVsquYpEfSlxSnOnHSA3g	3f6376cd-56a3-4938-aabf-5d81f320b0cc	f	2023-05-31 11:27:02.632746+00	2023-05-31 11:27:02.63275+00	\N
00000000-0000-0000-0000-000000000000	15	EDLeD3K8V6D8UOXBm6uojA	3f6376cd-56a3-4938-aabf-5d81f320b0cc	f	2023-05-31 11:28:53.004423+00	2023-05-31 11:28:53.004427+00	\N
00000000-0000-0000-0000-000000000000	16	0ykmrWNbb5FefoHI3Z4fOw	3f6376cd-56a3-4938-aabf-5d81f320b0cc	f	2023-05-31 11:35:05.830738+00	2023-05-31 11:35:05.830742+00	\N
00000000-0000-0000-0000-000000000000	641	pFqxoEPbU3xPGDDeXCrOmQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-21 10:51:42.992777+00	2023-11-21 10:51:42.992781+00	\N
00000000-0000-0000-0000-000000000000	18	9oI372_-e_qIsID7MRpISg	d65f781f-aa00-4344-9d11-8d7dbd93cc2a	f	2023-06-06 15:12:12.038392+00	2023-06-06 15:12:12.038396+00	\N
00000000-0000-0000-0000-000000000000	174	V4iDdAwwe4IpDQOK_E_IVw	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-08-09 13:07:57.574251+00	2023-08-09 13:07:57.574255+00	\N
00000000-0000-0000-0000-000000000000	341	UdzNXHAZTFONelLQ7SmlKw	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-09-13 07:46:40.490093+00	2023-09-13 07:46:40.490097+00	\N
00000000-0000-0000-0000-000000000000	342	3nxZOhQaxWCcEngVxD99eg	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-09-13 08:10:24.205945+00	2023-09-13 08:10:24.205949+00	\N
00000000-0000-0000-0000-000000000000	98	x4hg-bZ4Ax-UPNnjNKP-SA	1e10efef-b0fa-451a-8887-68af4003f8e0	f	2023-07-17 15:11:39.13541+00	2023-07-17 15:11:39.135415+00	\N
00000000-0000-0000-0000-000000000000	99	BgVbNLCL8OURz5N5r36W7A	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-07-18 07:38:06.247781+00	2023-07-18 07:38:06.247786+00	\N
00000000-0000-0000-0000-000000000000	100	qt4w7GSb1htVBHJlt3cezA	9568c612-a0b9-44c5-8836-513234d53409	f	2023-07-18 09:25:07.460758+00	2023-07-18 09:25:07.460762+00	\N
00000000-0000-0000-0000-000000000000	482	-N8_nqyJacMrQjAJzjQ8Jw	668c355c-6d5f-4a11-8ffe-655910c60e37	f	2023-10-17 12:45:47.95466+00	2023-10-17 12:45:47.954664+00	\N
00000000-0000-0000-0000-000000000000	104	clXiSr1aEZ2m7Tb5-YyJWg	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-07-19 14:05:10.059858+00	2023-07-19 14:05:10.059862+00	\N
00000000-0000-0000-0000-000000000000	179	El5IEFaedTWLCQvk4tIlEw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-10 09:15:33.454396+00	2023-08-10 09:15:33.4544+00	\N
00000000-0000-0000-0000-000000000000	180	W8vUlmVHBzSB2dLkhSF-dA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-10 09:20:27.965113+00	2023-08-10 09:20:27.965117+00	\N
00000000-0000-0000-0000-000000000000	930	-3_hA5asB3DaGmkhxvCkRA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-19 15:09:35.956776+00	2024-01-19 15:09:35.95678+00	\N
00000000-0000-0000-0000-000000000000	32	gi-92YXqPQpO3gL5NMV9XA	dd81a893-3943-4c40-bc72-64ada30d6313	f	2023-07-03 09:45:49.779017+00	2023-07-03 09:45:49.779021+00	\N
00000000-0000-0000-0000-000000000000	931	cPXIevG-io5L6xlwzFt5wA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-19 16:18:05.74063+00	2024-01-19 16:18:05.740635+00	\N
00000000-0000-0000-0000-000000000000	34	zf1S6Q6NdYM-wMJ6DqeanQ	41602c8c-1891-4ad9-8caf-a5ff5e14e44c	f	2023-07-04 12:01:10.539177+00	2023-07-04 12:01:10.539181+00	\N
00000000-0000-0000-0000-000000000000	36	M1SSkPGqO12DlsWxEB6Mww	35e699a6-d7de-4041-9f55-cd1f3c55e4a4	f	2023-07-04 14:06:14.63835+00	2023-07-04 14:06:14.638354+00	\N
00000000-0000-0000-0000-000000000000	38	7W2YeJfSo8rFXDuLKF1U6A	55b00a8c-87de-4cb9-a1db-82a8d510b755	f	2023-07-05 06:29:01.689282+00	2023-07-05 06:29:01.689285+00	\N
00000000-0000-0000-0000-000000000000	40	CvXKG-ZbT2NLZibMPbzi7w	aef71ffd-93d5-4e24-bd88-94cd786ff20c	f	2023-07-05 07:50:58.147791+00	2023-07-05 07:50:58.147795+00	\N
00000000-0000-0000-0000-000000000000	42	ElFes9a1o-OzwMjHw9f1uw	d3efd193-2193-44ce-bd7e-65aadc90770f	f	2023-07-05 09:17:49.701059+00	2023-07-05 09:17:49.701063+00	\N
00000000-0000-0000-0000-000000000000	44	Kbi5RaBMA3U6BIEC5BbZ6g	3725afc0-fdf7-41ba-b247-cdbf9f411ef8	f	2023-07-05 09:55:49.028762+00	2023-07-05 09:55:49.028767+00	\N
00000000-0000-0000-0000-000000000000	46	tpVFBO9onYRJCKE8ulou1A	a148f2f4-f5ea-46f2-876e-750163b3d9f8	f	2023-07-05 09:58:32.085639+00	2023-07-05 09:58:32.085642+00	\N
00000000-0000-0000-0000-000000000000	47	4754cg5mD77EMAtX2nL-Gw	1e10efef-b0fa-451a-8887-68af4003f8e0	f	2023-07-05 10:01:10.349382+00	2023-07-05 10:01:10.349387+00	\N
00000000-0000-0000-0000-000000000000	48	7K41NZbHQ3iOWMjeei8dkg	5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a	f	2023-07-05 10:01:46.176983+00	2023-07-05 10:01:46.176987+00	\N
00000000-0000-0000-0000-000000000000	49	IZlc_JpYMed0DcNvnia-kQ	5b1cfb7c-cbed-4167-b6d5-bc1d793ab10a	f	2023-07-05 10:03:06.054158+00	2023-07-05 10:03:06.054162+00	\N
00000000-0000-0000-0000-000000000000	50	_FlOntgA6fwf8x72ftLTLA	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-07-05 10:05:45.338559+00	2023-07-05 10:05:45.338563+00	\N
00000000-0000-0000-0000-000000000000	189	O3pchTFqTFrSxVgFEC3Gyw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-14 07:25:03.379791+00	2023-08-14 07:25:03.379796+00	\N
00000000-0000-0000-0000-000000000000	292	QZPyEhH9w8bN01DyZeuA0Q	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-09-05 13:06:56.973767+00	2023-09-05 13:06:56.973771+00	\N
00000000-0000-0000-0000-000000000000	191	tInfXbY5tVWvqjfFG04law	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-14 08:28:46.308809+00	2023-08-14 08:28:46.308813+00	\N
00000000-0000-0000-0000-000000000000	194	Ffdy8toOQXuUsKXUS6JdRw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-14 11:43:33.030332+00	2023-08-14 11:43:33.030336+00	\N
00000000-0000-0000-0000-000000000000	58	k56_SXgOD-ymeOcVjY0Zug	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-07-06 06:12:54.875183+00	2023-07-06 06:12:54.875188+00	\N
00000000-0000-0000-0000-000000000000	296	uoozokZRPkbHpE8vWE5dYg	052bba0f-4e48-4802-b1c6-db8f496c3d0f	f	2023-09-06 11:16:35.994717+00	2023-09-06 11:16:35.994721+00	\N
00000000-0000-0000-0000-000000000000	62	A4fjdzEYqziyFNcKDheKAA	9568c612-a0b9-44c5-8836-513234d53409	f	2023-07-06 11:06:50.871693+00	2023-07-06 11:06:50.871696+00	\N
00000000-0000-0000-0000-000000000000	63	uA5BYyNMDMPcp86QtaJC-Q	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-07-06 11:13:07.086687+00	2023-07-06 11:13:07.086691+00	\N
00000000-0000-0000-0000-000000000000	65	rNzUpMDZMQDh4DCHpdVjyw	9568c612-a0b9-44c5-8836-513234d53409	f	2023-07-06 11:16:43.895319+00	2023-07-06 11:16:43.895323+00	\N
00000000-0000-0000-0000-000000000000	66	JhzccqOm0fkT5k8_er9MCA	9568c612-a0b9-44c5-8836-513234d53409	f	2023-07-06 11:17:09.521344+00	2023-07-06 11:17:09.521348+00	\N
00000000-0000-0000-0000-000000000000	299	s-mYqSsWxbZoLrdKs8atSg	052bba0f-4e48-4802-b1c6-db8f496c3d0f	f	2023-09-06 13:14:30.572242+00	2023-09-06 13:14:30.572246+00	\N
00000000-0000-0000-0000-000000000000	68	omScumm_auvJEFCMMZbV4w	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-07-07 08:30:05.904626+00	2023-07-07 08:30:05.90463+00	\N
00000000-0000-0000-0000-000000000000	69	-DCMfvF3V7qnyhd4QTEWDQ	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-07-07 09:54:18.024996+00	2023-07-07 09:54:18.025+00	\N
00000000-0000-0000-0000-000000000000	70	ED4GuqL3QagL7tY7ATYTZg	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-07-08 19:21:31.48007+00	2023-07-08 19:21:31.480074+00	\N
00000000-0000-0000-0000-000000000000	130	uk6ESYJV_lAT_BsXPWySDg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-07-28 14:10:05.871699+00	2023-07-28 14:10:05.871703+00	\N
00000000-0000-0000-0000-000000000000	309	80KWqVhIefw56CtiBva1Rw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-09-07 17:50:24.4279+00	2023-09-07 17:50:24.427906+00	\N
00000000-0000-0000-0000-000000000000	310	cvToTAJcecNCySgCuf6xQw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-09-07 19:02:41.134908+00	2023-09-07 19:02:41.134912+00	\N
00000000-0000-0000-0000-000000000000	195	DAS-kE0WZuupex6piqQdCg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-14 12:47:47.190066+00	2023-08-14 12:47:47.19007+00	\N
00000000-0000-0000-0000-000000000000	344	8UUP4y73gGWCsXUQ-_yDaA	5ae4e2f6-8bac-4eac-90e0-d510fad92f5c	f	2023-09-13 08:26:49.882233+00	2023-09-13 08:26:49.882237+00	\N
00000000-0000-0000-0000-000000000000	345	fDnKRWQAtOdwDHSoZ50wEg	2c14f694-9727-4a00-82ba-ffe95995daba	f	2023-09-13 08:29:39.904531+00	2023-09-13 08:29:39.904537+00	\N
00000000-0000-0000-0000-000000000000	642	ykTrE7YlSPp4seRvIw02ZA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-21 12:29:26.915103+00	2023-11-21 12:29:26.915107+00	\N
00000000-0000-0000-0000-000000000000	135	Q5g7kM7lNd7s-le4xSi2_A	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-08-02 13:03:55.01385+00	2023-08-02 13:03:55.013855+00	\N
00000000-0000-0000-0000-000000000000	136	EslMueauEbbfwpEUQit2kg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-08-02 13:03:55.078134+00	2023-08-02 13:03:55.078138+00	\N
00000000-0000-0000-0000-000000000000	347	m-B6kE0eckEmOX8ajOuyLg	c78ef091-20e0-469d-924c-c3965d0a627b	f	2023-09-13 08:59:31.484995+00	2023-09-13 08:59:31.484999+00	\N
00000000-0000-0000-0000-000000000000	200	ryGKZ2TSlcuI2XxVz1gPhw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-15 07:39:09.116724+00	2023-08-15 07:39:09.116728+00	\N
00000000-0000-0000-0000-000000000000	201	Ovb3baisYdPXih4-KxSqhg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-15 11:07:40.976355+00	2023-08-15 11:07:40.976359+00	\N
00000000-0000-0000-0000-000000000000	348	qbZdnM6yGH4uBq6MnSYavw	6b96221f-4b78-4d4a-82c4-3afb64233abd	f	2023-09-13 09:10:57.101287+00	2023-09-13 09:10:57.101291+00	\N
00000000-0000-0000-0000-000000000000	203	VIT1vf4_BnC-M3BmsOVCMA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-15 12:13:02.441136+00	2023-08-15 12:13:02.44114+00	\N
00000000-0000-0000-0000-000000000000	643	fFQiWIT_o5zPQjYoKgekng	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-21 13:33:28.033279+00	2023-11-21 13:33:28.033283+00	\N
00000000-0000-0000-0000-000000000000	350	djXM5mR6IIuT55Adg7aoNQ	1995e110-98cb-4a27-9bb4-84734b8dd102	f	2023-09-13 09:43:57.964128+00	2023-09-13 09:43:57.964132+00	\N
00000000-0000-0000-0000-000000000000	351	Xb4klI6jSyg9b-GhC0QW2A	6b96221f-4b78-4d4a-82c4-3afb64233abd	f	2023-09-13 09:59:09.028318+00	2023-09-13 09:59:09.028322+00	\N
00000000-0000-0000-0000-000000000000	352	UH5CxJ1x49aqZufsSphTAA	eee9d0d2-7d6e-450d-8b0d-581ba19141c9	f	2023-09-13 11:10:30.080496+00	2023-09-13 11:10:30.0805+00	\N
00000000-0000-0000-0000-000000000000	353	ydok3LgaAJxmtxyC25FnQA	eee9d0d2-7d6e-450d-8b0d-581ba19141c9	f	2023-09-13 11:20:03.288889+00	2023-09-13 11:20:03.288894+00	\N
00000000-0000-0000-0000-000000000000	354	7K_s3RrUDDBVelT1ZWF2zQ	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-09-13 11:40:58.023778+00	2023-09-13 11:40:58.023782+00	\N
00000000-0000-0000-0000-000000000000	932	_8mKYCE3xaMLoOxx99uGMg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-19 18:55:45.729984+00	2024-01-19 18:55:45.729988+00	\N
00000000-0000-0000-0000-000000000000	267	K-PnEEEW03n6UOfUsHJ1kg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-04 07:32:11.899567+00	2023-09-04 07:32:11.899571+00	\N
00000000-0000-0000-0000-000000000000	933	MmAqi1FZRU3iXJAkN4sC8Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-21 09:15:48.972552+00	2024-01-21 09:15:48.972556+00	\N
00000000-0000-0000-0000-000000000000	356	htcDqjNZDdN9g_xr8WQKBg	3ddc99b1-a269-49a8-a693-c0fd68d39a20	f	2023-09-13 13:14:54.464508+00	2023-09-13 13:14:54.464512+00	\N
00000000-0000-0000-0000-000000000000	152	q3Iz-J-TLB_quOh7omVWBw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-08-03 14:33:31.797322+00	2023-08-03 14:33:31.797327+00	\N
00000000-0000-0000-0000-000000000000	214	AuNMRliL9WeQ_lTDoRqZrg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-18 18:43:49.390091+00	2023-08-18 18:43:49.390095+00	\N
00000000-0000-0000-0000-000000000000	215	2YYm7Az720FikY0yrH8f1w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-08-19 13:20:12.019579+00	2023-08-19 13:20:12.019583+00	\N
00000000-0000-0000-0000-000000000000	216	prYmbnNsgoYAwGYeu2Q_mw	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-08-21 05:25:59.23135+00	2023-08-21 05:25:59.231354+00	\N
00000000-0000-0000-0000-000000000000	269	_3q-AxSr_Bm1X6X1OIIzLQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-04 08:32:18.252504+00	2023-09-04 08:32:18.252508+00	\N
00000000-0000-0000-0000-000000000000	270	hTKqw2d56kOd4ww27UWYHg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-04 09:37:36.881837+00	2023-09-04 09:37:36.881841+00	\N
00000000-0000-0000-0000-000000000000	219	pE1hnH3e0SJfLB9PVzyKPg	1e10efef-b0fa-451a-8887-68af4003f8e0	f	2023-08-21 14:26:44.301324+00	2023-08-21 14:26:44.301329+00	\N
00000000-0000-0000-0000-000000000000	159	o8Q4tqvnSOYq9mYulhe6lA	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-08-07 06:53:40.480794+00	2023-08-07 06:53:40.480798+00	\N
00000000-0000-0000-0000-000000000000	160	ynzIfKacp16iqNDhC_BO4g	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-08-07 07:18:22.283673+00	2023-08-07 07:18:22.283678+00	\N
00000000-0000-0000-0000-000000000000	357	SWIdg6e6D2soxZ3Acrd-fg	5ae4e2f6-8bac-4eac-90e0-d510fad92f5c	f	2023-09-13 13:21:29.463337+00	2023-09-13 13:21:29.463341+00	\N
00000000-0000-0000-0000-000000000000	645	t761ig14eKnIanxjAyi5Lg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-21 14:46:58.115259+00	2023-11-21 14:46:58.115264+00	\N
00000000-0000-0000-0000-000000000000	273	vm2fiEBQHc9_2xICKSO00Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-04 11:38:08.671481+00	2023-09-04 11:38:08.671486+00	\N
00000000-0000-0000-0000-000000000000	274	VFPZWugaoNYfdmEQE5t1Mw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-04 13:56:13.459805+00	2023-09-04 13:56:13.459809+00	\N
00000000-0000-0000-0000-000000000000	359	pt028O19v2JjvyFBFzp1Ew	668c355c-6d5f-4a11-8ffe-655910c60e37	f	2023-09-13 14:08:21.930707+00	2023-09-13 14:08:21.93071+00	\N
00000000-0000-0000-0000-000000000000	646	W3IZh84TOxUU_AJgjmM68g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-21 15:37:27.005924+00	2023-11-21 15:37:27.005929+00	\N
00000000-0000-0000-0000-000000000000	361	VhotzmnZKVrgY6CZdSgzlw	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-09-13 18:27:37.267291+00	2023-09-13 18:27:37.267296+00	\N
00000000-0000-0000-0000-000000000000	362	sohjLiIMTMUIm1xrWeQvrw	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-09-13 19:31:00.635052+00	2023-09-13 19:31:00.635056+00	\N
00000000-0000-0000-0000-000000000000	363	gqdyt7GZqepwjoGE9WV-nw	06ff93e5-b026-4efc-a899-be2bd33487d2	f	2023-09-14 06:23:22.761591+00	2023-09-14 06:23:22.761598+00	\N
00000000-0000-0000-0000-000000000000	364	g8MLSHH2qWR4Kj3tF3pwqA	05b83aa4-1715-4ad1-abfd-dba964b81f27	f	2023-09-14 08:01:05.571075+00	2023-09-14 08:01:05.571079+00	\N
00000000-0000-0000-0000-000000000000	365	id3F1u9f-tT5qsxdbLy0oQ	06ff93e5-b026-4efc-a899-be2bd33487d2	f	2023-09-14 08:30:58.93887+00	2023-09-14 08:30:58.938874+00	\N
00000000-0000-0000-0000-000000000000	934	8OR5_wUGu2yeT8uyu4WC6w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-21 10:21:51.893865+00	2024-01-21 10:21:51.893869+00	\N
00000000-0000-0000-0000-000000000000	526	rZauYG1-cMbr4K1bZfVPCg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-10-27 14:32:36.824532+00	2023-10-27 14:32:36.824537+00	\N
00000000-0000-0000-0000-000000000000	935	NeeU1V8lho0LvBoDswA2UA	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2024-01-21 10:30:20.556263+00	2024-01-21 10:30:20.556267+00	\N
00000000-0000-0000-0000-000000000000	369	U4olg3Rmr6JBboW8zESH7A	668c355c-6d5f-4a11-8ffe-655910c60e37	f	2023-09-14 11:14:22.499056+00	2023-09-14 11:14:22.49906+00	\N
00000000-0000-0000-0000-000000000000	370	geAEiM3WIdL6CdrQ2IRgtQ	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-09-14 11:14:29.745276+00	2023-09-14 11:14:29.74528+00	\N
00000000-0000-0000-0000-000000000000	312	iQsyebPLHv_hsL6A66xltg	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-09-08 07:54:05.559426+00	2023-09-08 07:54:05.559429+00	\N
00000000-0000-0000-0000-000000000000	936	YvV0JA7gcD03SAvsTfnJsA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-21 11:23:44.726585+00	2024-01-21 11:23:44.726589+00	\N
00000000-0000-0000-0000-000000000000	314	bVANOCNsU5kcSyU7UwRnWw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-08 12:28:34.763153+00	2023-09-08 12:28:34.763157+00	\N
00000000-0000-0000-0000-000000000000	371	oMkamoIDgoK8OCkhvGnW9A	05b83aa4-1715-4ad1-abfd-dba964b81f27	f	2023-09-14 11:39:44.581137+00	2023-09-14 11:39:44.581141+00	\N
00000000-0000-0000-0000-000000000000	372	YPa29lFTS0SN9dmVxQkkWg	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-09-14 12:25:27.920861+00	2023-09-14 12:25:27.920866+00	\N
00000000-0000-0000-0000-000000000000	649	9YlnBPds6zZw1mVzexcjEA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-22 08:48:46.580145+00	2023-11-22 08:48:46.580149+00	\N
00000000-0000-0000-0000-000000000000	650	tHs4b1MHgDAxzn3LnbTsqg	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-11-22 10:13:23.03158+00	2023-11-22 10:13:23.031584+00	\N
00000000-0000-0000-0000-000000000000	937	JZlXyccQtRkWYL8O9e55DQ	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2024-01-21 12:46:05.247164+00	2024-01-21 12:46:05.247168+00	\N
00000000-0000-0000-0000-000000000000	376	wYQk3In4F2rad3_1rTBlKw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-15 07:30:36.514062+00	2023-09-15 07:30:36.514066+00	\N
00000000-0000-0000-0000-000000000000	530	DvhvATecdkqxgjSq5ZkvfA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-10-30 13:34:37.408646+00	2023-10-30 13:34:37.408652+00	\N
00000000-0000-0000-0000-000000000000	322	ME9E2bfZiwj3wJ7lku1vAA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-11 13:46:13.776398+00	2023-09-11 13:46:13.776403+00	\N
00000000-0000-0000-0000-000000000000	330	L-PKVRVHZohr2NG4XPAF9A	afe4b578-1ae4-4bbf-a595-b2c2789a77b4	f	2023-09-13 06:45:33.877314+00	2023-09-13 06:45:33.877318+00	\N
00000000-0000-0000-0000-000000000000	331	HIbgvOOG2u5lNgDE8btMlQ	3ddc99b1-a269-49a8-a693-c0fd68d39a20	f	2023-09-13 06:45:34.679552+00	2023-09-13 06:45:34.679556+00	\N
00000000-0000-0000-0000-000000000000	332	WMu1MT-1Av-FX3yAnFGR2w	c78ef091-20e0-469d-924c-c3965d0a627b	f	2023-09-13 06:57:40.05065+00	2023-09-13 06:57:40.050654+00	\N
00000000-0000-0000-0000-000000000000	333	wsG_vkS9G524vKj2SuAKZA	06ff93e5-b026-4efc-a899-be2bd33487d2	f	2023-09-13 06:59:40.842381+00	2023-09-13 06:59:40.842386+00	\N
00000000-0000-0000-0000-000000000000	377	4Zos6DG_6O0Amy_efMefcw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-15 08:38:36.551507+00	2023-09-15 08:38:36.551511+00	\N
00000000-0000-0000-0000-000000000000	378	tV9RCGKMZ_a0QgZxhX88rA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-15 09:39:22.249664+00	2023-09-15 09:39:22.249668+00	\N
00000000-0000-0000-0000-000000000000	379	fJAxaej0iQqhFXQgo_6VyA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-15 11:48:50.80928+00	2023-09-15 11:48:50.809285+00	\N
00000000-0000-0000-0000-000000000000	380	D_zlA85U2v0pSUKT9z20sg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-16 09:29:55.87686+00	2023-09-16 09:29:55.876864+00	\N
00000000-0000-0000-0000-000000000000	381	I01uSaEYw8Hk9zRliA1G1A	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-16 11:39:57.492098+00	2023-09-16 11:39:57.492103+00	\N
00000000-0000-0000-0000-000000000000	382	WsOMSouC_bg6BEJ-bMTkSA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-16 12:49:40.826144+00	2023-09-16 12:49:40.826149+00	\N
00000000-0000-0000-0000-000000000000	383	V21vIwudH7a3SSztjueb7Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-09-16 14:11:36.312618+00	2023-09-16 14:11:36.312622+00	\N
00000000-0000-0000-0000-000000000000	938	10XcYdI651LsSrJ2rTGE4A	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-22 10:49:58.371651+00	2024-01-22 10:49:58.371655+00	\N
00000000-0000-0000-0000-000000000000	652	gvl4rvp92jYIPuWtj_s0tA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-22 12:54:18.555315+00	2023-11-22 12:54:18.555319+00	\N
00000000-0000-0000-0000-000000000000	939	fXe3Ju3cxhzon6fMgTLOog	d128758c-c2ea-406d-99f8-4568706ba91e	f	2024-01-22 12:16:32.871126+00	2024-01-22 12:16:32.87113+00	\N
00000000-0000-0000-0000-000000000000	387	z05DotRYlAOSCP-SKrgZxQ	704d43de-7fd6-48b2-bbac-ff661132144e	f	2023-09-19 08:48:37.699065+00	2023-09-19 08:48:37.699069+00	\N
00000000-0000-0000-0000-000000000000	1031	vUXTB2mySx48dCtkgKaN-A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 19:09:26.067104+00	2024-01-29 19:09:26.067109+00	\N
00000000-0000-0000-0000-000000000000	704	d8vPydWbWVd2KZxgcXdq1Q	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 19:16:22.345475+00	2023-11-29 19:16:22.345479+00	\N
00000000-0000-0000-0000-000000000000	705	imSgM6nr7pUg3ggoE8EDuQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 20:13:58.62543+00	2023-11-29 20:13:58.625436+00	\N
00000000-0000-0000-0000-000000000000	391	maIs-0CzluJ-ZroBlzXnIQ	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-09-20 07:38:15.814562+00	2023-09-20 07:38:15.814566+00	\N
00000000-0000-0000-0000-000000000000	392	yIGbs_1u1uW4Sh_fE79TwQ	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-09-20 07:39:15.363866+00	2023-09-20 07:39:15.36387+00	\N
00000000-0000-0000-0000-000000000000	393	8Nw_3DVZRLF3o9vhvosMAQ	ff5a12c3-d2fd-4b5b-b70d-ed02ba26ec0a	f	2023-09-20 07:41:23.627322+00	2023-09-20 07:41:23.627326+00	\N
00000000-0000-0000-0000-000000000000	1032	pXdgWIW5dtztsL5dY8wRhg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 20:15:02.214719+00	2024-01-29 20:15:02.214723+00	\N
00000000-0000-0000-0000-000000000000	1033	L_IkO-x6ZRPExwj0GpHK1Q	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 20:15:17.091903+00	2024-01-29 20:15:17.091907+00	\N
00000000-0000-0000-0000-000000000000	396	9ZlfLo8rUTS3UURTGRHegQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-20 14:02:05.758211+00	2023-09-20 14:02:05.758215+00	\N
00000000-0000-0000-0000-000000000000	397	5KK1w3fkgu4O6kp5OAZw_A	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-20 15:11:03.965256+00	2023-09-20 15:11:03.96526+00	\N
00000000-0000-0000-0000-000000000000	491	LbtFPjS2kA3ZwvFcsebWeg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-10-19 13:43:29.220441+00	2023-10-19 13:43:29.220446+00	\N
00000000-0000-0000-0000-000000000000	399	zpkgo-IFVnOH9o26fzrUhg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-25 08:54:18.553699+00	2023-09-25 08:54:18.553703+00	\N
00000000-0000-0000-0000-000000000000	706	NDCwIGU8htPy8oT4_J_0MQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 21:24:54.040177+00	2023-11-29 21:24:54.040181+00	\N
00000000-0000-0000-0000-000000000000	707	sxgqNTmX5VJ8QCRxkuPWYw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 22:26:40.60086+00	2023-11-29 22:26:40.600865+00	\N
00000000-0000-0000-0000-000000000000	708	S8pdT4PIikV04UCNTxTVtQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 23:31:11.787919+00	2023-11-29 23:31:11.787923+00	\N
00000000-0000-0000-0000-000000000000	709	lUDronEnWCHUXx_NN5UoRw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 00:31:58.54823+00	2023-11-30 00:31:58.548236+00	\N
00000000-0000-0000-0000-000000000000	404	oVSreNAEW-Oxg_f3VRZhxw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-27 06:15:26.633754+00	2023-09-27 06:15:26.633758+00	\N
00000000-0000-0000-0000-000000000000	496	8i8y5SjDLObWN4vFnJd6yQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-21 08:26:25.587755+00	2023-10-21 08:26:25.587759+00	\N
00000000-0000-0000-0000-000000000000	497	A7OUoWKneBHTva_U_LMSxA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-21 08:39:51.25496+00	2023-10-21 08:39:51.254965+00	\N
00000000-0000-0000-0000-000000000000	407	Dt6iZDvy5Hd3_kzo09cn4w	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-27 07:30:41.134262+00	2023-09-27 07:30:41.134266+00	\N
00000000-0000-0000-0000-000000000000	498	t3b7Z5dsorIUjgvgCE8nSg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-21 11:58:23.123003+00	2023-10-21 11:58:23.123007+00	\N
00000000-0000-0000-0000-000000000000	499	HlSDTCAwsyXoClULdQrKew	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-21 13:01:07.166322+00	2023-10-21 13:01:07.166327+00	\N
00000000-0000-0000-0000-000000000000	500	cSWmFin05UMTOHcuDAu9pg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-22 08:15:16.279251+00	2023-10-22 08:15:16.279259+00	\N
00000000-0000-0000-0000-000000000000	501	svfOMgbD0ZIhrZrlIyEsiQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-22 09:16:26.663875+00	2023-10-22 09:16:26.663879+00	\N
00000000-0000-0000-0000-000000000000	412	0tK90ZpP5GDwSCq4H8Ljbg	668c355c-6d5f-4a11-8ffe-655910c60e37	f	2023-09-27 12:25:55.255994+00	2023-09-27 12:25:55.256021+00	\N
00000000-0000-0000-0000-000000000000	413	Le6BeeGvRczkVkanv1F0DQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-09-28 11:40:24.044587+00	2023-09-28 11:40:24.044591+00	\N
00000000-0000-0000-0000-000000000000	414	VXU_rOBpEVriLrAVxVwdHA	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-09-29 04:39:11.613022+00	2023-09-29 04:39:11.613026+00	\N
00000000-0000-0000-0000-000000000000	1034	q9U7jRb84vUDEncLKhDKOA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 21:24:24.675347+00	2024-01-29 21:24:24.675351+00	\N
00000000-0000-0000-0000-000000000000	416	M7O8J22oY9mSaDlb3aIIwA	b1cc6265-a789-46c0-ba9f-dd2ad47e878d	f	2023-10-02 12:08:09.747692+00	2023-10-02 12:08:09.747696+00	\N
00000000-0000-0000-0000-000000000000	711	5ZArvDZMjSp7GzMNysiH4A	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-30 08:25:59.875438+00	2023-11-30 08:25:59.875442+00	\N
00000000-0000-0000-0000-000000000000	712	mHWaMbCndAu4-SX2-VMwIA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-30 09:11:27.397493+00	2023-11-30 09:11:27.397498+00	\N
00000000-0000-0000-0000-000000000000	505	zm7ydI_TLME8jG_CXYKxXw	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-10-23 09:38:48.700259+00	2023-10-23 09:38:48.700264+00	\N
00000000-0000-0000-0000-000000000000	713	x8prFACohlCpTul-3uPGRA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-30 09:29:55.692993+00	2023-11-30 09:29:55.692998+00	\N
00000000-0000-0000-0000-000000000000	714	nzSj93U_JVVNGHn_dAM9Uw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-30 10:14:12.214141+00	2023-11-30 10:14:12.214145+00	\N
00000000-0000-0000-0000-000000000000	508	c_URsXjRE4WBcpogZojoIw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-10-24 07:12:09.822975+00	2023-10-24 07:12:09.822979+00	\N
00000000-0000-0000-0000-000000000000	1035	eOdtVcPXrskmbBgF07MT0A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 22:28:49.499168+00	2024-01-29 22:28:49.499173+00	\N
00000000-0000-0000-0000-000000000000	424	rMRINUXdrdyfO-vxhLcfNQ	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-03 13:55:09.823082+00	2023-10-03 13:55:09.823086+00	\N
00000000-0000-0000-0000-000000000000	425	NhirqouamSL-O3Zs5_gMyg	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-04 07:17:01.462449+00	2023-10-04 07:17:01.462453+00	\N
00000000-0000-0000-0000-000000000000	716	MNj7EgJXdXq-2jU6OnMeJg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 12:26:05.502397+00	2023-11-30 12:26:05.502402+00	\N
00000000-0000-0000-0000-000000000000	1036	oVcI7rHMCfZrGlWoY25tJg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-30 08:12:37.491881+00	2024-01-30 08:12:37.491885+00	\N
00000000-0000-0000-0000-000000000000	717	wycr1FjBG4eH8zvbvsGQ0g	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 13:26:48.079391+00	2023-11-30 13:26:48.079395+00	\N
00000000-0000-0000-0000-000000000000	1037	knYc-OC4Wk9Y-UweSTdW1g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-30 09:27:29.037131+00	2024-01-30 09:27:29.037137+00	\N
00000000-0000-0000-0000-000000000000	430	jtrslz-SYyQe0835keG4SA	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-05 06:15:31.256047+00	2023-10-05 06:15:31.256051+00	\N
00000000-0000-0000-0000-000000000000	719	FBjfr0Pfq73XAUtKGe4VGA	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-11-30 13:59:08.405244+00	2023-11-30 13:59:08.405248+00	\N
00000000-0000-0000-0000-000000000000	720	Zr1B1v0zg_CDO_Cagi7-7Q	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-30 14:10:53.349129+00	2023-11-30 14:10:53.349134+00	\N
00000000-0000-0000-0000-000000000000	516	j24B54l3p87sRdSuU6O0rQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-10-26 11:26:28.643823+00	2023-10-26 11:26:28.643827+00	\N
00000000-0000-0000-0000-000000000000	434	a4CLpcUyie0h6glcIzabCw	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-05 11:23:05.097415+00	2023-10-05 11:23:05.097419+00	\N
00000000-0000-0000-0000-000000000000	435	t7iuOpjiCyQQu_c0RtIODA	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-05 12:24:56.876025+00	2023-10-05 12:24:56.876029+00	\N
00000000-0000-0000-0000-000000000000	436	SijYRVMkjQkwEJnAZQBBJw	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-05 13:28:10.139725+00	2023-10-05 13:28:10.139731+00	\N
00000000-0000-0000-0000-000000000000	437	N72-P80QCvo7RpR-RNzNWA	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-05 14:28:37.508784+00	2023-10-05 14:28:37.508789+00	\N
00000000-0000-0000-0000-000000000000	517	tfRbPEvG5nO9Px78_6y-KA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-10-26 11:35:02.881853+00	2023-10-26 11:35:02.881857+00	\N
00000000-0000-0000-0000-000000000000	653	xP4upiD7XNDa_xY_Lp0_Fg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-22 14:00:35.495254+00	2023-11-22 14:00:35.495258+00	\N
00000000-0000-0000-0000-000000000000	519	364P8v6uh2i3YClL-pLJXA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-10-26 12:41:53.244401+00	2023-10-26 12:41:53.244405+00	\N
00000000-0000-0000-0000-000000000000	520	_nX1OQqyPwfsdX0JptZa2g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-10-26 13:55:32.42702+00	2023-10-26 13:55:32.427025+00	\N
00000000-0000-0000-0000-000000000000	940	3ZNeokiYQQTaxG4b5JBZAg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-22 12:52:30.467066+00	2024-01-22 12:52:30.46707+00	\N
00000000-0000-0000-0000-000000000000	655	4CjuOQanMk40abDlRH4ylw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-23 09:25:50.635491+00	2023-11-23 09:25:50.635495+00	\N
00000000-0000-0000-0000-000000000000	444	eF-HB6YqDYPJ36zOua0JXQ	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-09 14:04:31.668971+00	2023-10-09 14:04:31.668976+00	\N
00000000-0000-0000-0000-000000000000	445	JK8ZdbTXoxNH6betBDsd7A	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-09 15:04:38.731669+00	2023-10-09 15:04:38.731674+00	\N
00000000-0000-0000-0000-000000000000	941	VnfJkl9lcEoUSnosXpC3ww	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-22 14:28:03.06939+00	2024-01-22 14:28:03.069394+00	\N
00000000-0000-0000-0000-000000000000	657	Cu_hAfU2zogvIQSUD9G6zA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-23 14:46:08.714241+00	2023-11-23 14:46:08.714245+00	\N
00000000-0000-0000-0000-000000000000	539	xT6sKYVKdUZ0GGtmex3OLg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-01 12:51:46.747653+00	2023-11-01 12:51:46.747658+00	\N
00000000-0000-0000-0000-000000000000	540	LillDOQKhSBGXCVO4DN0IQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-01 13:51:52.409236+00	2023-11-01 13:51:52.40924+00	\N
00000000-0000-0000-0000-000000000000	658	2H8jOLtnR6k3jD9qzTTWBw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-23 15:48:13.083515+00	2023-11-23 15:48:13.083519+00	\N
00000000-0000-0000-0000-000000000000	659	0hx_0h5pfHbmsaqYc8ROLA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-23 19:13:15.757034+00	2023-11-23 19:13:15.757039+00	\N
00000000-0000-0000-0000-000000000000	660	rCKYMCGBmG1Aa_V4nbdy2A	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-23 20:13:50.792482+00	2023-11-23 20:13:50.792486+00	\N
00000000-0000-0000-0000-000000000000	453	Xec2sUSGvVr08L4LqL8K2A	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-12 07:30:47.257325+00	2023-10-12 07:30:47.257329+00	\N
00000000-0000-0000-0000-000000000000	454	bvnHBXYHpQZZin_i3rdQwg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-12 08:45:52.628624+00	2023-10-12 08:45:52.628628+00	\N
00000000-0000-0000-0000-000000000000	544	3P8NqqgSudmDPqdljte_Zw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-02 12:29:22.648159+00	2023-11-02 12:29:22.648163+00	\N
00000000-0000-0000-0000-000000000000	456	mFXvYU3LwQWJVijOA_4oyw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-12 09:47:43.053132+00	2023-10-12 09:47:43.053136+00	\N
00000000-0000-0000-0000-000000000000	457	edGUTEAX1wNuC-q5XcFP5w	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-12 12:03:53.961434+00	2023-10-12 12:03:53.961439+00	\N
00000000-0000-0000-0000-000000000000	942	hOySW_t1Hl_cGXtxojvXaw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-22 15:10:04.537742+00	2024-01-22 15:10:04.537747+00	\N
00000000-0000-0000-0000-000000000000	546	vjzWMsdBUb0d1EQ-YNUNUA	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-11-02 13:41:12.957053+00	2023-11-02 13:41:12.957057+00	\N
00000000-0000-0000-0000-000000000000	547	dNEX4kJGnuHQ9gYGsPHQbA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-02 13:59:16.356878+00	2023-11-02 13:59:16.356882+00	\N
00000000-0000-0000-0000-000000000000	461	c7XbR9a7Yoxrcs19F3K8Ug	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-10-12 14:20:59.092462+00	2023-10-12 14:20:59.092466+00	\N
00000000-0000-0000-0000-000000000000	663	ZkDcO4hTtxuD8K5fuD1WfA	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-24 12:52:59.477722+00	2023-11-24 12:52:59.477726+00	\N
00000000-0000-0000-0000-000000000000	464	4y3ISS4mJFvum85RjxvDzg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-14 09:32:00.773419+00	2023-10-14 09:32:00.773423+00	\N
00000000-0000-0000-0000-000000000000	465	2lc1E4Ds_nX20A-ou1GlTw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-14 10:37:58.506353+00	2023-10-14 10:37:58.506359+00	\N
00000000-0000-0000-0000-000000000000	466	2t1w-TUvj42o2VTIqXj3wg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-14 11:43:37.738021+00	2023-10-14 11:43:37.738025+00	\N
00000000-0000-0000-0000-000000000000	467	BxvWx1Q4HnJiIBHXM3sZtg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-14 12:52:41.415059+00	2023-10-14 12:52:41.415063+00	\N
00000000-0000-0000-0000-000000000000	468	FhdYQCvzHLLCIsQ8JxkwEQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-14 13:52:47.644312+00	2023-10-14 13:52:47.644316+00	\N
00000000-0000-0000-0000-000000000000	469	DUvY9-eslmDpVJHTIsJYFw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-10-14 17:37:41.829348+00	2023-10-14 17:37:41.829352+00	\N
00000000-0000-0000-0000-000000000000	664	0XKcrX90kiZcCd_hND9pAA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-25 09:13:20.723051+00	2023-11-25 09:13:20.723055+00	\N
00000000-0000-0000-0000-000000000000	471	i2PTaMTUAVwsETc9ml7dQA	3ddc99b1-a269-49a8-a693-c0fd68d39a20	f	2023-10-16 07:09:03.513757+00	2023-10-16 07:09:03.513761+00	\N
00000000-0000-0000-0000-000000000000	549	Ug0xFtQlno07lKw1bXCz6A	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-11-02 15:04:26.120874+00	2023-11-02 15:04:26.120878+00	\N
00000000-0000-0000-0000-000000000000	665	99cezxxM5Qr6F2B_98Whjw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-25 10:13:38.288787+00	2023-11-25 10:13:38.288791+00	\N
00000000-0000-0000-0000-000000000000	550	BNlI-lt7ZXYTXRQqpk79FQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-02 15:04:33.637182+00	2023-11-02 15:04:33.637186+00	\N
00000000-0000-0000-0000-000000000000	666	0dXk04j_OnK59PsSOa0hIg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-25 11:30:37.900417+00	2023-11-25 11:30:37.900421+00	\N
00000000-0000-0000-0000-000000000000	667	vkPb1xDX76YL5VlHWV5eOw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-25 12:30:58.64747+00	2023-11-25 12:30:58.647474+00	\N
00000000-0000-0000-0000-000000000000	668	xNOb_JFB_FG3LgurRRYZ2g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-25 13:21:23.786639+00	2023-11-25 13:21:23.786643+00	\N
00000000-0000-0000-0000-000000000000	669	NXedh8nKdYZdgn_OD-j4wQ	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-26 14:17:50.631203+00	2023-11-26 14:17:50.631207+00	\N
00000000-0000-0000-0000-000000000000	670	Ptob09J0YUGz9_vx5ZlANg	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-26 15:19:25.625815+00	2023-11-26 15:19:25.625819+00	\N
00000000-0000-0000-0000-000000000000	553	YCDe-oJu1RdOu-pwn9CyWw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-03 09:02:01.719939+00	2023-11-03 09:02:01.719943+00	\N
00000000-0000-0000-0000-000000000000	671	XSVyCH3LeC1CgVMqEuNmXg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-26 17:16:10.522384+00	2023-11-26 17:16:10.522388+00	\N
00000000-0000-0000-0000-000000000000	672	mc8LGrsW7q__xZp-vG8BLg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-26 18:17:48.216557+00	2023-11-26 18:17:48.216561+00	\N
00000000-0000-0000-0000-000000000000	556	b6mJSgvomy9-oB1SKi5dzg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-04 10:16:47.481757+00	2023-11-04 10:16:47.481761+00	\N
00000000-0000-0000-0000-000000000000	557	2OEXpakabh732nj-csXuyA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-04 11:25:11.497818+00	2023-11-04 11:25:11.497823+00	\N
00000000-0000-0000-0000-000000000000	558	V-gd2ZTWf8_kiTJQI-k1og	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-04 12:20:53.525167+00	2023-11-04 12:20:53.525171+00	\N
00000000-0000-0000-0000-000000000000	559	JBAIYDFzCfhZDnzaAaMT_Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-04 13:21:03.727528+00	2023-11-04 13:21:03.727532+00	\N
00000000-0000-0000-0000-000000000000	560	sZ9dA5A0NqiPs0E3dAhPXw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-05 09:54:35.474722+00	2023-11-05 09:54:35.474726+00	\N
00000000-0000-0000-0000-000000000000	561	mD0EZ8YyMUzPD3SWxoZdTw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-05 10:54:43.758102+00	2023-11-05 10:54:43.758106+00	\N
00000000-0000-0000-0000-000000000000	562	qarwAyqMvue1kg5D-jjajw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-05 13:09:31.291624+00	2023-11-05 13:09:31.291628+00	\N
00000000-0000-0000-0000-000000000000	673	IGF8ii7DKUpTXSGkAjMQwA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-26 19:18:01.16671+00	2023-11-26 19:18:01.166714+00	\N
00000000-0000-0000-0000-000000000000	564	4rmwi_6sVdEuSzoenbQO7A	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-06 07:59:03.855041+00	2023-11-06 07:59:03.855046+00	\N
00000000-0000-0000-0000-000000000000	565	Tj9kpE-7owwjaD-9xooP9A	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-06 09:18:11.256115+00	2023-11-06 09:18:11.256119+00	\N
00000000-0000-0000-0000-000000000000	566	lsQpe7tXem5LD3EqwGXN-g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-06 10:23:34.833869+00	2023-11-06 10:23:34.833873+00	\N
00000000-0000-0000-0000-000000000000	567	ftada2QVjLGgh3KSaD0WTg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-06 11:26:29.7795+00	2023-11-06 11:26:29.779504+00	\N
00000000-0000-0000-0000-000000000000	568	x_pff5MlnPryIjTQNDASFw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-06 12:31:17.641239+00	2023-11-06 12:31:17.641243+00	\N
00000000-0000-0000-0000-000000000000	569	B7qiE4FnIv1B_KN-drjT1w	704d43de-7fd6-48b2-bbac-ff661132144e	f	2023-11-06 13:14:29.303942+00	2023-11-06 13:14:29.303946+00	\N
00000000-0000-0000-0000-000000000000	674	4wfuHnzUxmVKLItPHvWQSw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-26 20:23:24.225956+00	2023-11-26 20:23:24.22596+00	\N
00000000-0000-0000-0000-000000000000	944	VPOIcl0nioKC83FmsFRCxw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-22 15:43:14.447716+00	2024-01-22 15:43:14.44772+00	\N
00000000-0000-0000-0000-000000000000	676	pZje_o4AD7TSRvvRuoJGGw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-27 10:06:48.625868+00	2023-11-27 10:06:48.625873+00	\N
00000000-0000-0000-0000-000000000000	573	K6oWYTc-OqQ1xUkgipuCzg	9568c612-a0b9-44c5-8836-513234d53409	f	2023-11-07 06:01:58.732098+00	2023-11-07 06:01:58.732102+00	\N
00000000-0000-0000-0000-000000000000	677	qEssIKyoorSW1tUf92GZ1g	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-27 12:58:39.43338+00	2023-11-27 12:58:39.433384+00	\N
00000000-0000-0000-0000-000000000000	678	DJK8tcbXhQ4yzTObVzKdiQ	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-27 13:02:47.771386+00	2023-11-27 13:02:47.771391+00	\N
00000000-0000-0000-0000-000000000000	680	Pu6xFDY-9j8RRlbTmyrUBA	356537c3-fb03-44f4-8e81-7871ad36760f	f	2023-11-27 13:55:34.439589+00	2023-11-27 13:55:34.439594+00	\N
00000000-0000-0000-0000-000000000000	681	AxS_dVUCrdkid00M7A0mcQ	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-27 14:20:07.687258+00	2023-11-27 14:20:07.687262+00	\N
00000000-0000-0000-0000-000000000000	946	ARcZq0yClLWNKcUqnaCUzw	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2024-01-23 07:15:24.630234+00	2024-01-23 07:15:24.63024+00	\N
00000000-0000-0000-0000-000000000000	583	QrSO0UF8VeLA98CmR9AkEQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-08 15:51:55.34835+00	2023-11-08 15:51:55.348355+00	\N
00000000-0000-0000-0000-000000000000	584	HUh30pSbncWygpYlw7_INA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-08 18:44:42.203648+00	2023-11-08 18:44:42.203653+00	\N
00000000-0000-0000-0000-000000000000	586	hQXQi-N0IrXrB-kT9iZwWA	668c355c-6d5f-4a11-8ffe-655910c60e37	f	2023-11-09 09:54:46.67098+00	2023-11-09 09:54:46.670984+00	\N
00000000-0000-0000-0000-000000000000	587	ss4zeu4ynYXP2TUGtoBdHQ	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-11-09 10:57:55.682651+00	2023-11-09 10:57:55.682655+00	\N
00000000-0000-0000-0000-000000000000	687	ZszsphXMLpGY70IaUJQB3Q	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-28 21:43:22.376506+00	2023-11-28 21:43:22.37651+00	\N
00000000-0000-0000-0000-000000000000	951	kETiAPTucXN89q8Bnuydag	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-23 09:23:28.352263+00	2024-01-23 09:23:28.352268+00	\N
00000000-0000-0000-0000-000000000000	689	E-Yclq7njxdXC0Ta12GTUA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 10:06:58.989369+00	2023-11-29 10:06:58.989373+00	\N
00000000-0000-0000-0000-000000000000	952	a-WEle_FZTtgXofzdA3FuA	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2024-01-23 09:51:06.079665+00	2024-01-23 09:51:06.079669+00	\N
00000000-0000-0000-0000-000000000000	592	JEA2gPEWVbq1v_xCN0hUcg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-10 10:52:17.197178+00	2023-11-10 10:52:17.197182+00	\N
00000000-0000-0000-0000-000000000000	593	DuDPBI_vGr1ukhDuyP7t1g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-10 12:06:55.044862+00	2023-11-10 12:06:55.044866+00	\N
00000000-0000-0000-0000-000000000000	594	_8HGsJvQQfGQcp0Fo8V49w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-11 08:26:29.748774+00	2023-11-11 08:26:29.748779+00	\N
00000000-0000-0000-0000-000000000000	595	gaG8ECShELCqf-0ZJyuw1w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-11 09:28:53.532175+00	2023-11-11 09:28:53.532179+00	\N
00000000-0000-0000-0000-000000000000	596	uNyveidltQZnchunRE_-HA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-11 10:22:34.893218+00	2023-11-11 10:22:34.893222+00	\N
00000000-0000-0000-0000-000000000000	597	qiaTHJ4GXDg24FSt2uUGrA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-11 10:28:57.037494+00	2023-11-11 10:28:57.037499+00	\N
00000000-0000-0000-0000-000000000000	598	b8FvCI04hNtMyPb1RVcjjQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-11 11:26:47.022444+00	2023-11-11 11:26:47.022448+00	\N
00000000-0000-0000-0000-000000000000	599	5rbWHTh_0rp_KN8RoLEkYA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-11 12:15:47.439051+00	2023-11-11 12:15:47.439055+00	\N
00000000-0000-0000-0000-000000000000	600	LkKH7q8vSIRd7oDFpXxCwQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-12 09:50:43.154297+00	2023-11-12 09:50:43.154302+00	\N
00000000-0000-0000-0000-000000000000	601	Z2cixrieTpGWKE9cIq03kw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-12 10:54:00.063401+00	2023-11-12 10:54:00.063412+00	\N
00000000-0000-0000-0000-000000000000	602	kq_nQUVkQoO7niMfsbJ6Wg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-12 11:54:20.736912+00	2023-11-12 11:54:20.736916+00	\N
00000000-0000-0000-0000-000000000000	691	n0CWpKWD3VBYxmY-BBwTtg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 11:07:25.829483+00	2023-11-29 11:07:25.829488+00	\N
00000000-0000-0000-0000-000000000000	604	vD0StInk5b-l2FClc_x98w	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-13 10:17:07.7976+00	2023-11-13 10:17:07.797604+00	\N
00000000-0000-0000-0000-000000000000	605	Sn2tyrB_kqadsCLV91Zt0g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-13 12:41:57.167013+00	2023-11-13 12:41:57.167017+00	\N
00000000-0000-0000-0000-000000000000	606	Z6rmfkLnW9zIst0873uKGQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-13 13:14:33.866902+00	2023-11-13 13:14:33.866906+00	\N
00000000-0000-0000-0000-000000000000	607	loA4XuYlJMGVyVY_CpPSVg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-13 13:47:08.999184+00	2023-11-13 13:47:08.999188+00	\N
00000000-0000-0000-0000-000000000000	608	8IgJffdUB_7k8OymGRpk1g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-13 14:32:00.917765+00	2023-11-13 14:32:00.917772+00	\N
00000000-0000-0000-0000-000000000000	609	qDNY1R0yNIk6qWoTvzHmhw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-13 14:49:12.933467+00	2023-11-13 14:49:12.933472+00	\N
00000000-0000-0000-0000-000000000000	692	FlCitnNdPRgM0XNEKOnogw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 12:08:29.961578+00	2023-11-29 12:08:29.961582+00	\N
00000000-0000-0000-0000-000000000000	953	xRzl8KoHQ8A9MShEaqORvg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-23 10:24:59.246892+00	2024-01-23 10:24:59.246896+00	\N
00000000-0000-0000-0000-000000000000	694	FSqpay9FfS9eccxr4q5qXA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 13:09:48.23807+00	2023-11-29 13:09:48.238074+00	\N
00000000-0000-0000-0000-000000000000	613	4-QT3tHaZmFVldNGabGtnA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-15 18:43:29.717218+00	2023-11-15 18:43:29.717222+00	\N
00000000-0000-0000-0000-000000000000	614	TMKcVt2VHCdQwZd4DUiK3w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-15 19:48:57.387613+00	2023-11-15 19:48:57.387617+00	\N
00000000-0000-0000-0000-000000000000	954	0bEhMxOWKCdXr4m_UFHyaw	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2024-01-23 11:01:23.954112+00	2024-01-23 11:01:23.954116+00	\N
00000000-0000-0000-0000-000000000000	616	j2OaKlZrfzFAooJiW9H-0A	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-16 08:07:24.328447+00	2023-11-16 08:07:24.328451+00	\N
00000000-0000-0000-0000-000000000000	617	wRUEgVpi9ysppd_Cwt6BZQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-16 09:14:48.650434+00	2023-11-16 09:14:48.650438+00	\N
00000000-0000-0000-0000-000000000000	618	u6FrxfHUavzRzui5APTE9w	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-16 10:17:47.334768+00	2023-11-16 10:17:47.334772+00	\N
00000000-0000-0000-0000-000000000000	619	46Ma9jhQ41MZDCvJmEKONQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-16 12:08:05.042775+00	2023-11-16 12:08:05.042779+00	\N
00000000-0000-0000-0000-000000000000	620	0Zv9Aouy5W6Or4C5L9S5Lg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-16 12:54:34.866575+00	2023-11-16 12:54:34.866579+00	\N
00000000-0000-0000-0000-000000000000	621	0FKqSuybc0yQJMKgLYh18g	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-11-16 13:35:19.432761+00	2023-11-16 13:35:19.432766+00	\N
00000000-0000-0000-0000-000000000000	622	hpc0yENxBDveTzchJCpEeA	6b96221f-4b78-4d4a-82c4-3afb64233abd	f	2023-11-16 14:07:17.001153+00	2023-11-16 14:07:17.001157+00	\N
00000000-0000-0000-0000-000000000000	955	u3hQXJHxqOjksfiRVeEkQw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-23 12:16:35.244032+00	2024-01-23 12:16:35.244036+00	\N
00000000-0000-0000-0000-000000000000	624	xkpAN-WeAy5Wc6XcUdPbFg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-17 09:25:17.045081+00	2023-11-17 09:25:17.045085+00	\N
00000000-0000-0000-0000-000000000000	625	TvTB44xrJcTOAg5sfQT7kw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-17 10:40:59.333634+00	2023-11-17 10:40:59.333638+00	\N
00000000-0000-0000-0000-000000000000	626	RIa5X0LVat24qVbNGKDFrw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-17 11:59:04.040569+00	2023-11-17 11:59:04.040573+00	\N
00000000-0000-0000-0000-000000000000	627	J2gNDY8etfopo6UZgFVBzw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-19 06:04:45.093372+00	2023-11-19 06:04:45.093385+00	\N
00000000-0000-0000-0000-000000000000	628	nRXcRj_KfKODlv3EVoIJLA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-19 07:04:54.91995+00	2023-11-19 07:04:54.919954+00	\N
00000000-0000-0000-0000-000000000000	629	AAWuX1IhGIqSzrg_dhbzdw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-19 08:06:09.964313+00	2023-11-19 08:06:09.964318+00	\N
00000000-0000-0000-0000-000000000000	630	Z0Smkny6RxE1p5DfUB6b8g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-19 09:11:05.635594+00	2023-11-19 09:11:05.635598+00	\N
00000000-0000-0000-0000-000000000000	631	4SxFJoQYRWq2DPd6rlYJlA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-19 10:13:23.885497+00	2023-11-19 10:13:23.885501+00	\N
00000000-0000-0000-0000-000000000000	632	Y5rngpNJ4YB8jW4AGVGlew	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-11-19 12:44:13.079479+00	2023-11-19 12:44:13.079483+00	\N
00000000-0000-0000-0000-000000000000	956	uRnExdOEKG27ZYjH_bigJQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 12:41:50.037908+00	2024-01-23 12:41:50.037912+00	\N
00000000-0000-0000-0000-000000000000	633	mMbwVF3ecwOy2dOcqOuz5w	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-19 13:30:56.611656+00	2023-11-19 13:30:56.61166+00	\N
00000000-0000-0000-0000-000000000000	634	DhTAbogAL-xhJuYBjSoukw	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-19 15:28:43.255298+00	2023-11-19 15:28:43.255302+00	\N
00000000-0000-0000-0000-000000000000	696	jOJcG8rhX7isN-5uYsrR7g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-29 13:33:41.603556+00	2023-11-29 13:33:41.603562+00	\N
00000000-0000-0000-0000-000000000000	636	Q3JCHcoplgiN1qfQOjNttg	ef2ccc58-d6ef-4af7-a456-858a39200ebd	f	2023-11-20 14:34:01.755818+00	2023-11-20 14:34:01.755822+00	\N
00000000-0000-0000-0000-000000000000	637	c3I0ghoCjgREe6kKjuwkFw	ef2ccc58-d6ef-4af7-a456-858a39200ebd	f	2023-11-20 14:34:50.152514+00	2023-11-20 14:34:50.152518+00	\N
00000000-0000-0000-0000-000000000000	697	UuJwvqE3gMC6yc821pky9g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 14:10:52.487599+00	2023-11-29 14:10:52.487603+00	\N
00000000-0000-0000-0000-000000000000	957	9nHH95Yz_iBkeimlbn96BA	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2024-01-23 13:43:25.331425+00	2024-01-23 13:43:25.331429+00	\N
00000000-0000-0000-0000-000000000000	698	czj5RlnQHAhlypKjWkHNJQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-11-29 15:14:21.640973+00	2023-11-29 15:14:21.640977+00	\N
00000000-0000-0000-0000-000000000000	699	KsrMbPDglUbk-dxkMH36Fg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 15:26:37.460668+00	2023-11-29 15:26:37.460672+00	\N
00000000-0000-0000-0000-000000000000	700	77jwpsVLno6qcyY0I5Rkjg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-29 16:28:37.130452+00	2023-11-29 16:28:37.130456+00	\N
00000000-0000-0000-0000-000000000000	701	7UVnVDf_T8V5tZQda2F58Q	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 16:41:37.310663+00	2023-11-29 16:41:37.310667+00	\N
00000000-0000-0000-0000-000000000000	702	1ixSftlBOB2HaGML-eR12g	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 17:51:17.561509+00	2023-11-29 17:51:17.561513+00	\N
00000000-0000-0000-0000-000000000000	703	E5-3xETC4QDb3_yucmMOmQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-29 18:55:15.615473+00	2023-11-29 18:55:15.615477+00	\N
00000000-0000-0000-0000-000000000000	958	GPMCTWhV4gN5aWShvrJvig	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-23 13:48:38.243779+00	2024-01-23 13:48:38.243783+00	\N
00000000-0000-0000-0000-000000000000	722	S1iTRROhI03VPymkTCFGWA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 14:55:12.254743+00	2023-11-30 14:55:12.254747+00	\N
00000000-0000-0000-0000-000000000000	723	ePdU73ewlVmrAlzPo0Nx8A	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-30 15:02:40.433914+00	2023-11-30 15:02:40.433919+00	\N
00000000-0000-0000-0000-000000000000	724	K5HG1n2WDo5y5ZnYS67qCg	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-30 15:11:41.587248+00	2023-11-30 15:11:41.587252+00	\N
00000000-0000-0000-0000-000000000000	725	P-v7dsBHf_HHs_dSJr_PCw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 15:56:14.6884+00	2023-11-30 15:56:14.688405+00	\N
00000000-0000-0000-0000-000000000000	726	uL70SZBG1OyqqPzCLS9aYg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-11-30 16:02:53.968101+00	2023-11-30 16:02:53.968105+00	\N
00000000-0000-0000-0000-000000000000	727	9_XgmzleA5FBPSvOmmA-KQ	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-11-30 16:23:04.59207+00	2023-11-30 16:23:04.592075+00	\N
00000000-0000-0000-0000-000000000000	728	1ekrn_Yx1xY6gfd2EVgFKA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 16:57:24.853542+00	2023-11-30 16:57:24.853546+00	\N
00000000-0000-0000-0000-000000000000	729	mwGvjehtvqzscGOSb2scSQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 17:57:47.979931+00	2023-11-30 17:57:47.979935+00	\N
00000000-0000-0000-0000-000000000000	730	QwvP0U6nxj7HGXXBeHVvAw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 19:24:00.601331+00	2023-11-30 19:24:00.601335+00	\N
00000000-0000-0000-0000-000000000000	731	8zWnuAdSmJel8EKfQBm8ew	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 20:28:35.012042+00	2023-11-30 20:28:35.012065+00	\N
00000000-0000-0000-0000-000000000000	732	LvNyFmL6w2OuhdPpg88P7Q	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 21:32:12.609655+00	2023-11-30 21:32:12.609659+00	\N
00000000-0000-0000-0000-000000000000	733	HAtB1lmpAFOzGugJku7C1g	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-11-30 23:13:52.291951+00	2023-11-30 23:13:52.291955+00	\N
00000000-0000-0000-0000-000000000000	734	Wpm2zQqdevchrs-mmtevIQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-01 00:15:13.460263+00	2023-12-01 00:15:13.460267+00	\N
00000000-0000-0000-0000-000000000000	735	Y2gW_dBCvEDQuTxcoao-vQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-01 01:19:40.997053+00	2023-12-01 01:19:40.997057+00	\N
00000000-0000-0000-0000-000000000000	736	4768B6Tl1IA6cFrw3ibWuQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-01 10:10:57.789713+00	2023-12-01 10:10:57.789717+00	\N
00000000-0000-0000-0000-000000000000	737	r6BgtqwJ0WVCJdSJqGXeVA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-01 11:45:49.858978+00	2023-12-01 11:45:49.858982+00	\N
00000000-0000-0000-0000-000000000000	738	u2fvGxmW-afORc6Wrvfv4g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-12-01 12:42:46.776998+00	2023-12-01 12:42:46.777003+00	\N
00000000-0000-0000-0000-000000000000	739	6RjYlo1pJ-EcGd4nn0cQKw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-01 13:21:22.625858+00	2023-12-01 13:21:22.625862+00	\N
00000000-0000-0000-0000-000000000000	740	xAd5aXAnBXoZffcwR_hoTQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-12-01 14:19:05.993047+00	2023-12-01 14:19:05.993053+00	\N
00000000-0000-0000-0000-000000000000	741	_1cBPOU5VXStUGrelBSO_w	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-01 14:37:44.684126+00	2023-12-01 14:37:44.68413+00	\N
00000000-0000-0000-0000-000000000000	742	ffU9v6KnMl1Ee6U-JKP-2A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-01 15:38:40.828022+00	2023-12-01 15:38:40.828026+00	\N
00000000-0000-0000-0000-000000000000	743	Wo_KLkpufPUBvFYcGNGn3A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-01 16:40:26.585533+00	2023-12-01 16:40:26.585537+00	\N
00000000-0000-0000-0000-000000000000	744	YfFPkgudHZqwL470kbHW9g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-03 08:38:10.799522+00	2023-12-03 08:38:10.799526+00	\N
00000000-0000-0000-0000-000000000000	745	3vZeTmXYG0InAmq-o_BXiQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-03 09:38:37.533645+00	2023-12-03 09:38:37.533649+00	\N
00000000-0000-0000-0000-000000000000	746	ZJypmzl2FErCfgAtxyUMEg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-03 10:53:24.047281+00	2023-12-03 10:53:24.047285+00	\N
00000000-0000-0000-0000-000000000000	747	qDfiXtq-VuJAYubLaVyLQQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-03 12:38:29.698386+00	2023-12-03 12:38:29.69839+00	\N
00000000-0000-0000-0000-000000000000	748	757TmRKRl5CtEMjO5vE7ww	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-04 15:04:57.65402+00	2023-12-04 15:04:57.654024+00	\N
00000000-0000-0000-0000-000000000000	749	mlwyMhP5NXN2944Gmkka8A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2023-12-04 16:35:36.580336+00	2023-12-04 16:35:36.580341+00	\N
00000000-0000-0000-0000-000000000000	959	g3u_WT0_YUYjm2co6T7whQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-23 13:51:36.555287+00	2024-01-23 13:51:36.555291+00	\N
00000000-0000-0000-0000-000000000000	752	MK_yTAq86kwAr7kMB21BgA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-12-05 08:12:08.373089+00	2023-12-05 08:12:08.373093+00	\N
00000000-0000-0000-0000-000000000000	753	zjDLol8Nzetlhgr6-_xUuA	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-12-05 09:15:04.702782+00	2023-12-05 09:15:04.702786+00	\N
00000000-0000-0000-0000-000000000000	754	DrdZVigtLm6Ixa4CzmWotw	d128758c-c2ea-406d-99f8-4568706ba91e	f	2023-12-05 12:34:58.894296+00	2023-12-05 12:34:58.8943+00	\N
00000000-0000-0000-0000-000000000000	961	2WGKKllyNaATL0n5mYkYwg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 14:50:38.553286+00	2024-01-23 14:50:38.553292+00	\N
00000000-0000-0000-0000-000000000000	962	PavcPuCMiTdvB7ARox1zkA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-23 14:52:36.495023+00	2024-01-23 14:52:36.495027+00	\N
00000000-0000-0000-0000-000000000000	757	-Fb8is4GgyHr10xRpQARjg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-05 15:15:20.736959+00	2023-12-05 15:15:20.736964+00	\N
00000000-0000-0000-0000-000000000000	758	6xS6K5aRS_v4LRLjQGbhvQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-12-05 15:43:38.942777+00	2023-12-05 15:43:38.942781+00	\N
00000000-0000-0000-0000-000000000000	759	YqA7JQslPOfMiKNchaKnAw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-05 17:48:16.489719+00	2023-12-05 17:48:16.489724+00	\N
00000000-0000-0000-0000-000000000000	963	mm2QPZrIQG-HJOio2hmzLg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-23 14:57:34.19333+00	2024-01-23 14:57:34.193334+00	\N
00000000-0000-0000-0000-000000000000	761	l09uZc0OoCKu7v5N3abNdg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-06 08:42:20.610079+00	2023-12-06 08:42:20.610083+00	\N
00000000-0000-0000-0000-000000000000	762	fdqvFVbKYG5mC4_7wkg_eA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-06 09:44:05.285829+00	2023-12-06 09:44:05.285833+00	\N
00000000-0000-0000-0000-000000000000	763	Dt2tNPfR2bXyO1YkEyneCw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2023-12-07 12:52:51.287214+00	2023-12-07 12:52:51.287218+00	\N
00000000-0000-0000-0000-000000000000	764	DIyq218YYxXpbOu5BAeaIw	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2023-12-07 21:12:52.173861+00	2023-12-07 21:12:52.173866+00	\N
00000000-0000-0000-0000-000000000000	964	ka_G242fpZmhqDfEA4TzLg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-23 15:52:37.201041+00	2024-01-23 15:52:37.201045+00	\N
00000000-0000-0000-0000-000000000000	766	XAVCOpmsy3L6wiwtWWYdog	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-09 10:58:41.985614+00	2023-12-09 10:58:41.985618+00	\N
00000000-0000-0000-0000-000000000000	767	SPBFsRwoiNqWxHLJYqAf9A	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-09 15:16:25.764842+00	2023-12-09 15:16:25.764846+00	\N
00000000-0000-0000-0000-000000000000	965	X3TlbNgDXJ5bjMFnCdYh3w	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 16:45:48.273708+00	2024-01-23 16:45:48.273712+00	\N
00000000-0000-0000-0000-000000000000	966	t3tDq6kYiagajneCODfS5Q	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 17:47:30.907874+00	2024-01-23 17:47:30.907878+00	\N
00000000-0000-0000-0000-000000000000	967	S0yD5wqhh3xjqE4I3_XskA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 19:04:34.566037+00	2024-01-23 19:04:34.566041+00	\N
00000000-0000-0000-0000-000000000000	968	iM3MhFHO4bvxxFZRSTdGEg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 20:25:03.061913+00	2024-01-23 20:25:03.061917+00	\N
00000000-0000-0000-0000-000000000000	969	-OzN-Gp9dQdWvX7bxJ66sA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-23 21:33:33.657696+00	2024-01-23 21:33:33.6577+00	\N
00000000-0000-0000-0000-000000000000	971	pONQQT-058AtVBAeItEV7w	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-24 08:41:24.030937+00	2024-01-24 08:41:24.030941+00	\N
00000000-0000-0000-0000-000000000000	776	FDRs4usE7MFSHIzGGONiSw	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2023-12-13 10:46:09.428667+00	2023-12-13 10:46:09.428673+00	\N
00000000-0000-0000-0000-000000000000	778	_igKjAQglG5JnTp_8OS_Kg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-14 11:32:22.300497+00	2023-12-14 11:32:22.300501+00	\N
00000000-0000-0000-0000-000000000000	974	p5YYqoYn2-oho9MmMkCZPA	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2024-01-24 09:29:08.021479+00	2024-01-24 09:29:08.021483+00	\N
00000000-0000-0000-0000-000000000000	780	4XWA8VlL9SQefoFunlXmzg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-14 12:47:48.364812+00	2023-12-14 12:47:48.364816+00	\N
00000000-0000-0000-0000-000000000000	782	Off1-74tuoQu-XEA7trH4w	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-16 09:51:58.711825+00	2023-12-16 09:51:58.711829+00	\N
00000000-0000-0000-0000-000000000000	976	90j6h7K0pRzaxCDu5g2ayg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-24 10:39:43.347677+00	2024-01-24 10:39:43.347681+00	\N
00000000-0000-0000-0000-000000000000	977	A9gOwV13zNjnNpC5G62UEQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-24 12:33:53.796481+00	2024-01-24 12:33:53.796485+00	\N
00000000-0000-0000-0000-000000000000	978	B13-aIdS_uT8UXEHGSa5vg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 12:37:33.474259+00	2024-01-24 12:37:33.474263+00	\N
00000000-0000-0000-0000-000000000000	979	105JDYr3S8jqGKvY7GvYAQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 13:37:44.211994+00	2024-01-24 13:37:44.211998+00	\N
00000000-0000-0000-0000-000000000000	980	ZW-kVnMbKltUjoI93V0NUw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-24 13:45:25.944287+00	2024-01-24 13:45:25.944291+00	\N
00000000-0000-0000-0000-000000000000	982	P_SY2ol0WjOavg26xtZvig	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2024-01-24 14:12:42.563727+00	2024-01-24 14:12:42.563731+00	\N
00000000-0000-0000-0000-000000000000	790	wMIsCU2GkpoSZ6ufl2ppjA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-19 09:20:43.8041+00	2023-12-19 09:20:43.804104+00	\N
00000000-0000-0000-0000-000000000000	983	jgBJ5WKS3ykmMUv06nfhxA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 14:37:59.366149+00	2024-01-24 14:37:59.366153+00	\N
00000000-0000-0000-0000-000000000000	984	JXLRsZ3OuXpWKtCZgBNegg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-24 14:47:01.034807+00	2024-01-24 14:47:01.034811+00	\N
00000000-0000-0000-0000-000000000000	986	RWwvaxIr8XojIZcZWODOEg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 15:38:50.757839+00	2024-01-24 15:38:50.757843+00	\N
00000000-0000-0000-0000-000000000000	987	igrqGiU77ySffbBS7Z0D5g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-24 15:48:15.373332+00	2024-01-24 15:48:15.373336+00	\N
00000000-0000-0000-0000-000000000000	796	YVAgTWlsTHHkGEu-GTAQiA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 09:09:15.556369+00	2023-12-20 09:09:15.556373+00	\N
00000000-0000-0000-0000-000000000000	797	xJpWgXC8mlJpUqCa3-1ZVw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 10:31:05.629742+00	2023-12-20 10:31:05.629747+00	\N
00000000-0000-0000-0000-000000000000	989	rwuZkae2XOSoPVGbVnqYrA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 17:01:10.9967+00	2024-01-24 17:01:10.996704+00	\N
00000000-0000-0000-0000-000000000000	800	LAFljHzpqjErAYhmbT2Mcw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 12:46:54.928137+00	2023-12-20 12:46:54.928141+00	\N
00000000-0000-0000-0000-000000000000	990	-8EOp0w2JqqNTUfMkIzXVA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 19:41:18.792203+00	2024-01-24 19:41:18.792208+00	\N
00000000-0000-0000-0000-000000000000	802	Gu12GxRyQJsP97EtgS4ApQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 13:48:55.789649+00	2023-12-20 13:48:55.789653+00	\N
00000000-0000-0000-0000-000000000000	803	Zkg2ugAieI00LczlhruN3g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 14:49:11.66662+00	2023-12-20 14:49:11.666624+00	\N
00000000-0000-0000-0000-000000000000	804	4Dhx_6Xs181n3fu6i_5LnQ	8ca7983a-d1f3-4e8a-be00-af7a24b0f66b	f	2023-12-20 15:30:28.669138+00	2023-12-20 15:30:28.669142+00	\N
00000000-0000-0000-0000-000000000000	805	RSQZ0CQQxsQLH0VhkdbuRw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 15:50:12.207737+00	2023-12-20 15:50:12.207742+00	\N
00000000-0000-0000-0000-000000000000	806	ZH-iNQWzoh7cK3UHZ1lfcg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-20 17:42:43.951743+00	2023-12-20 17:42:43.951747+00	\N
00000000-0000-0000-0000-000000000000	807	SbMivtKBHjslUxv6TG4pwA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-20 19:15:27.645358+00	2023-12-20 19:15:27.645362+00	\N
00000000-0000-0000-0000-000000000000	808	7qlMrttGG4I3BVIvm0Mnxw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-21 10:10:16.472748+00	2023-12-21 10:10:16.472752+00	\N
00000000-0000-0000-0000-000000000000	809	EqLk4Rphvw-_n4tsvyGx5Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-21 11:10:38.9514+00	2023-12-21 11:10:38.951405+00	\N
00000000-0000-0000-0000-000000000000	810	A9W0K1QEuoLObCLhpSwszA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-22 18:42:19.241068+00	2023-12-22 18:42:19.241073+00	\N
00000000-0000-0000-0000-000000000000	811	RMQoksoX-ED5igbBAlp8iQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-22 19:42:48.724336+00	2023-12-22 19:42:48.724341+00	\N
00000000-0000-0000-0000-000000000000	812	-pVrEuEAvi6NrrxnP9j1OA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-24 09:58:43.260201+00	2023-12-24 09:58:43.260205+00	\N
00000000-0000-0000-0000-000000000000	813	ktxcy4fUWbT1owQ8BZ8OFA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-24 15:10:05.859516+00	2023-12-24 15:10:05.85952+00	\N
00000000-0000-0000-0000-000000000000	814	9nNaIZ6NKDtYK58YRlNMow	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-24 16:12:10.176941+00	2023-12-24 16:12:10.176946+00	\N
00000000-0000-0000-0000-000000000000	815	AZ03_F0rx95cHCQufGnlMQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-26 08:20:53.163229+00	2023-12-26 08:20:53.163233+00	\N
00000000-0000-0000-0000-000000000000	816	hekKeKaZPnZIK6V3Cvs69w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-26 09:20:57.210126+00	2023-12-26 09:20:57.21013+00	\N
00000000-0000-0000-0000-000000000000	817	GPADBiZHmPSY1pXf7g-neA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-26 10:21:16.849306+00	2023-12-26 10:21:16.84931+00	\N
00000000-0000-0000-0000-000000000000	818	lrrx2Uocj_4fnvHQOtmiDA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 09:30:09.12404+00	2023-12-27 09:30:09.124045+00	\N
00000000-0000-0000-0000-000000000000	819	C_4--9-WSbnUil8PEbkECg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 10:52:27.2506+00	2023-12-27 10:52:27.250604+00	\N
00000000-0000-0000-0000-000000000000	820	SlahLFGRL9_xWk_F8YgTwA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 12:01:23.511419+00	2023-12-27 12:01:23.511424+00	\N
00000000-0000-0000-0000-000000000000	821	6gjW4BD4eMcX_rp63gINVg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-27 12:44:09.767676+00	2023-12-27 12:44:09.76768+00	\N
00000000-0000-0000-0000-000000000000	822	gUAqz6I9t-4czSlGgvkkow	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 13:02:58.469742+00	2023-12-27 13:02:58.469746+00	\N
00000000-0000-0000-0000-000000000000	823	1kJL5t7zkD06wUTrkI6QHg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-27 14:14:54.738383+00	2023-12-27 14:14:54.738387+00	\N
00000000-0000-0000-0000-000000000000	824	u6gq4LCZyYhPSen2UjMBAQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 15:26:30.047814+00	2023-12-27 15:26:30.047819+00	\N
00000000-0000-0000-0000-000000000000	825	_aQfXGZVDfjntO8qIi7pBA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 16:26:47.568098+00	2023-12-27 16:26:47.568103+00	\N
00000000-0000-0000-0000-000000000000	826	TFwoP4e8BSy7-VFAlaKr5g	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 17:27:36.620366+00	2023-12-27 17:27:36.620371+00	\N
00000000-0000-0000-0000-000000000000	827	breaEraJYPTad5tYJ-QFTA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 18:29:25.188763+00	2023-12-27 18:29:25.188767+00	\N
00000000-0000-0000-0000-000000000000	828	i_oulCDcjZyK0DBbloazKQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 20:43:16.044821+00	2023-12-27 20:43:16.044825+00	\N
00000000-0000-0000-0000-000000000000	829	N0X-4RsXWTqTk3funyyxSQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-27 21:44:10.043416+00	2023-12-27 21:44:10.04342+00	\N
00000000-0000-0000-0000-000000000000	991	ZLQOtWkeNEwsHBcf7DipbQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 20:42:39.655869+00	2024-01-24 20:42:39.655873+00	\N
00000000-0000-0000-0000-000000000000	992	FnzVhC0bSedo5Wp0hjvKLQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 21:42:58.571037+00	2024-01-24 21:42:58.571041+00	\N
00000000-0000-0000-0000-000000000000	830	gsmOY7HdQVvdzomdW6T93A	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-29 13:15:38.398259+00	2023-12-29 13:15:38.398263+00	\N
00000000-0000-0000-0000-000000000000	831	xehBNtC5enTNEIKDGF7gbg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-30 11:26:55.354766+00	2023-12-30 11:26:55.35477+00	\N
00000000-0000-0000-0000-000000000000	832	QPhl9xQdoklYi5xvMI9tNA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-30 13:38:25.604797+00	2023-12-30 13:38:25.604803+00	\N
00000000-0000-0000-0000-000000000000	833	hd8QXGpJ9mDCJ6HcXWWJpA	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-30 14:45:10.925085+00	2023-12-30 14:45:10.925089+00	\N
00000000-0000-0000-0000-000000000000	834	RaxqE6e5hc0lMXNY2TCviw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-30 16:02:13.118282+00	2023-12-30 16:02:13.118286+00	\N
00000000-0000-0000-0000-000000000000	835	GKKwgZEWqUTYr18yN9bZdQ	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-30 17:02:35.055131+00	2023-12-30 17:02:35.055136+00	\N
00000000-0000-0000-0000-000000000000	836	dU1T-q1Y3KpsrkYgw5yuSw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-30 18:02:37.513941+00	2023-12-30 18:02:37.513945+00	\N
00000000-0000-0000-0000-000000000000	837	jkqtAJaFqJzdKKkHtLqCdA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-31 08:58:50.537633+00	2023-12-31 08:58:50.537637+00	\N
00000000-0000-0000-0000-000000000000	838	C3XppA-k-udbaUkVBkJcpg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-31 09:31:15.898974+00	2023-12-31 09:31:15.898978+00	\N
00000000-0000-0000-0000-000000000000	839	jD0ayH_e9GLA0XBofS6unQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-31 10:05:05.944328+00	2023-12-31 10:05:05.944332+00	\N
00000000-0000-0000-0000-000000000000	840	RPDSNddOybJ75RnI2cd8Fg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-31 11:06:31.970037+00	2023-12-31 11:06:31.970041+00	\N
00000000-0000-0000-0000-000000000000	841	q37KjCazNpwZmyHQIfRh0g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-31 12:07:14.557176+00	2023-12-31 12:07:14.55718+00	\N
00000000-0000-0000-0000-000000000000	842	RpRhpfDB0unWUeTIiOMOfw	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-31 12:50:28.611318+00	2023-12-31 12:50:28.611322+00	\N
00000000-0000-0000-0000-000000000000	843	p6TNP5DXxrneS4ydOxQ2Wg	b1e36c73-19cc-40c1-9fb6-5a8d757aaf39	f	2023-12-31 13:50:52.312842+00	2023-12-31 13:50:52.312846+00	\N
00000000-0000-0000-0000-000000000000	844	Zv-IS_KlInh94FEN67ZwIQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-31 14:07:02.428037+00	2023-12-31 14:07:02.428041+00	\N
00000000-0000-0000-0000-000000000000	845	dNk9amBb42CB2IAwFHl8NA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2023-12-31 16:19:09.436924+00	2023-12-31 16:19:09.436928+00	\N
00000000-0000-0000-0000-000000000000	846	afibgLQb8ENiNnERf5EiYw	0a4d7141-2f02-4f1a-8df1-5494ce81916c	f	2024-01-03 15:45:54.959475+00	2024-01-03 15:45:54.959479+00	\N
00000000-0000-0000-0000-000000000000	993	f3321wBb0zI2kcEPqDTyBg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-24 22:43:14.845204+00	2024-01-24 22:43:14.845208+00	\N
00000000-0000-0000-0000-000000000000	996	YB6GoAI6f0fXeGsU608bGg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-25 08:35:24.339524+00	2024-01-25 08:35:24.339528+00	\N
00000000-0000-0000-0000-000000000000	1039	eA2k2RrNgNHFyEFt3fOO1w	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-30 10:47:27.051832+00	2024-01-30 10:47:27.051836+00	\N
00000000-0000-0000-0000-000000000000	1040	b7zS2GqcX94kDqsvJ_C11A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-30 13:01:53.084605+00	2024-01-30 13:01:53.08461+00	\N
00000000-0000-0000-0000-000000000000	1041	dGHyT1A7j5LGUWgJg69VOA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-30 14:05:11.493412+00	2024-01-30 14:05:11.493419+00	\N
00000000-0000-0000-0000-000000000000	1042	BKPul81ItWPfKfdOYZ3XqA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-30 14:19:55.962251+00	2024-01-30 14:19:55.962255+00	\N
00000000-0000-0000-0000-000000000000	1043	KnQkOQuUz--jAuCA2D8Xvg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-30 14:36:55.685567+00	2024-01-30 14:36:55.685572+00	\N
00000000-0000-0000-0000-000000000000	1044	nS3Dv_KmNLxJx0BFMQCzvA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-30 14:38:15.619869+00	2024-01-30 14:38:15.619873+00	\N
00000000-0000-0000-0000-000000000000	1045	8xjhiB1ipQHukMpvMJvUyg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-30 15:29:28.96212+00	2024-01-30 15:29:28.962124+00	\N
00000000-0000-0000-0000-000000000000	1046	7AMOoZ2S8NewNp-G4Q2j6g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-31 08:26:26.341119+00	2024-01-31 08:26:26.341123+00	\N
00000000-0000-0000-0000-000000000000	860	uWVG3mz209tSrgScaJEk3Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-11 08:50:51.381387+00	2024-01-11 08:50:51.381391+00	\N
00000000-0000-0000-0000-000000000000	861	Qvh_d8XdpK0SSX1eEa9z_g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-11 10:06:19.263395+00	2024-01-11 10:06:19.263399+00	\N
00000000-0000-0000-0000-000000000000	862	h816xHzr4S-gkPxA-UnTaQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-11 11:07:59.291168+00	2024-01-11 11:07:59.291172+00	\N
00000000-0000-0000-0000-000000000000	863	5Hm4Z4SqhuIEhYKXaXiYng	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-11 12:24:14.153559+00	2024-01-11 12:24:14.153563+00	\N
00000000-0000-0000-0000-000000000000	1047	CqYsFhICfziJaBnL8B7gHw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-31 09:28:11.947515+00	2024-01-31 09:28:11.947519+00	\N
00000000-0000-0000-0000-000000000000	1048	m44OUR-gftMrE67TPam_ug	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-31 10:09:13.5949+00	2024-01-31 10:09:13.594904+00	\N
00000000-0000-0000-0000-000000000000	1049	pKB4yudjWxVYlZXZyjxO-Q	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-31 10:28:30.281047+00	2024-01-31 10:28:30.281053+00	\N
00000000-0000-0000-0000-000000000000	1050	nZ4eETDSSdH1OxBZ7YJoUQ	d212b9ce-3c27-4b73-a55f-cf6a82894139	f	2024-01-31 11:06:48.448049+00	2024-01-31 11:06:48.448053+00	\N
00000000-0000-0000-0000-000000000000	1051	QsywXkbKz2ZrGYXLMmLw7g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-31 12:41:22.512072+00	2024-01-31 12:41:22.512077+00	\N
00000000-0000-0000-0000-000000000000	1052	75_WB0wxf-xqVBOeikT5aw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-31 13:29:54.716342+00	2024-01-31 13:29:54.716347+00	\N
00000000-0000-0000-0000-000000000000	1053	ZPfWegMND3moBxF6gJUsiQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-31 13:49:19.161871+00	2024-01-31 13:49:19.161875+00	\N
00000000-0000-0000-0000-000000000000	1054	yJ8sjgTJ_iLCEZqpXc8DHg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-31 14:31:47.106382+00	2024-01-31 14:31:47.106386+00	\N
00000000-0000-0000-0000-000000000000	872	wJC3ULgQ7L04VglaDhdEVw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-12 15:06:18.913898+00	2024-01-12 15:06:18.913902+00	\N
00000000-0000-0000-0000-000000000000	1055	BrJklseT0NgnxX-tT489Zg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-31 15:11:22.136912+00	2024-01-31 15:11:22.136916+00	\N
00000000-0000-0000-0000-000000000000	874	pJaonA9o4sGAU4N1JlH3Sg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-12 16:18:32.849169+00	2024-01-12 16:18:32.849173+00	\N
00000000-0000-0000-0000-000000000000	1056	QbZundxNqL8X72Xzid50hg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-31 15:32:03.864129+00	2024-01-31 15:32:03.864134+00	\N
00000000-0000-0000-0000-000000000000	876	xIeBhhzFz7jU1tVjbkM6Cw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-14 08:19:55.040451+00	2024-01-14 08:19:55.040456+00	\N
00000000-0000-0000-0000-000000000000	877	sl6xfJVL9XtKINyhdVlT_w	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-14 09:22:00.818206+00	2024-01-14 09:22:00.81821+00	\N
00000000-0000-0000-0000-000000000000	878	0XqLoz2L5qAI_PhLtGkx6g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-14 10:23:21.576385+00	2024-01-14 10:23:21.576389+00	\N
00000000-0000-0000-0000-000000000000	1057	kA4ocdGBUm0F42E2vnRflg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-31 20:16:56.130333+00	2024-01-31 20:16:56.130337+00	\N
00000000-0000-0000-0000-000000000000	1058	wgtpFgSfzKCmOg8-vxlgXg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-31 21:18:33.649448+00	2024-01-31 21:18:33.649452+00	\N
00000000-0000-0000-0000-000000000000	1059	cgj-KbKcAET_L9huCrIrig	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-31 22:19:09.935791+00	2024-01-31 22:19:09.935795+00	\N
00000000-0000-0000-0000-000000000000	1060	mQ_cu0Hkoi3B8SzIGZpGYg	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-01 06:59:44.377953+00	2024-02-01 06:59:44.377958+00	\N
00000000-0000-0000-0000-000000000000	1061	SkubS12rxDh2shTRiqVEKA	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-02-01 07:26:18.967604+00	2024-02-01 07:26:18.967609+00	\N
00000000-0000-0000-0000-000000000000	1062	lmw7UQsp8lqpacQexFilxA	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-02-01 09:02:50.844513+00	2024-02-01 09:02:50.844517+00	\N
00000000-0000-0000-0000-000000000000	1063	M-i_J2bP-fxxCuo3C3iCUA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-01 09:48:29.36112+00	2024-02-01 09:48:29.361124+00	\N
00000000-0000-0000-0000-000000000000	1064	jWrkgTnCZ0H7_CKjdGAkPQ	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-01 10:03:58.011239+00	2024-02-01 10:03:58.011244+00	\N
00000000-0000-0000-0000-000000000000	1065	IjB1w4iLtfTSku5NWzkVrA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-01 12:07:57.441321+00	2024-02-01 12:07:57.441325+00	\N
00000000-0000-0000-0000-000000000000	1066	lXNLB20Vwu1OvFfUexefkA	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-01 12:34:39.629229+00	2024-02-01 12:34:39.629233+00	\N
00000000-0000-0000-0000-000000000000	889	Ez51YXKhJNNtHNkgxOPPzQ	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-01-16 14:44:30.488105+00	2024-01-16 14:44:30.488109+00	\N
00000000-0000-0000-0000-000000000000	890	4FvrHW45-pFCi0jgH9lFqA	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-01-16 15:04:52.940971+00	2024-01-16 15:04:52.940975+00	\N
00000000-0000-0000-0000-000000000000	891	oEBN0mj_dy6ElGH7wK_pgg	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-01-16 15:06:52.613721+00	2024-01-16 15:06:52.613725+00	\N
00000000-0000-0000-0000-000000000000	892	FY1_QDcpb0KGhzulrfYAxQ	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-01-16 15:07:15.288227+00	2024-01-16 15:07:15.288231+00	\N
00000000-0000-0000-0000-000000000000	997	xb-birr2ji-Dr6YemtqeMg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-25 09:29:43.392107+00	2024-01-25 09:29:43.392111+00	\N
00000000-0000-0000-0000-000000000000	998	9wd69-asXVC1u7TrZO-CMg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-25 10:31:38.548097+00	2024-01-25 10:31:38.548102+00	\N
00000000-0000-0000-0000-000000000000	895	M4n7jsjVPCvTcu1adR7bfA	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-01-16 15:47:50.465018+00	2024-01-16 15:47:50.465022+00	\N
00000000-0000-0000-0000-000000000000	896	Exat40KAEltGV62OU4yJJw	ec61575d-322c-48ae-80c3-f9b2d9b4ce80	f	2024-01-16 15:52:42.033444+00	2024-01-16 15:52:42.033448+00	\N
00000000-0000-0000-0000-000000000000	897	fzK0D4stiSaUjJWZ8UoroA	356537c3-fb03-44f4-8e81-7871ad36760f	f	2024-01-16 16:19:36.878822+00	2024-01-16 16:19:36.878827+00	\N
00000000-0000-0000-0000-000000000000	898	bRCBDl9ZaflI-A2zfQVxfg	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-01-17 06:41:30.372861+00	2024-01-17 06:41:30.372865+00	\N
00000000-0000-0000-0000-000000000000	900	kLQzCJa2kik83ZDnOSmrDQ	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-01-17 07:37:09.375151+00	2024-01-17 07:37:09.375155+00	\N
00000000-0000-0000-0000-000000000000	901	byhj7S82JcQyPZ8_F_SAWA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-17 08:15:41.29056+00	2024-01-17 08:15:41.290564+00	\N
00000000-0000-0000-0000-000000000000	999	mi439ezPCfIcYY4Sfxap6g	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-25 10:39:17.512099+00	2024-01-25 10:39:17.512104+00	\N
00000000-0000-0000-0000-000000000000	903	DbW9YhLMd5vm_mpvqvv_kQ	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-01-17 09:07:26.221626+00	2024-01-17 09:07:26.221631+00	\N
00000000-0000-0000-0000-000000000000	906	2UHKPKEf5rrAzKqh4Xb2aQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-17 10:51:32.91904+00	2024-01-17 10:51:32.919044+00	\N
00000000-0000-0000-0000-000000000000	1000	Y83F3mERjJSt1DjOxLbdmg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-25 12:12:22.14824+00	2024-01-25 12:12:22.148244+00	\N
00000000-0000-0000-0000-000000000000	1001	ovyYli1X-RXnI-LGlXLdwA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-25 12:20:54.04901+00	2024-01-25 12:20:54.049014+00	\N
00000000-0000-0000-0000-000000000000	1002	sPEn6DCdaWLtcDtg2ReGGA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-25 13:10:19.329058+00	2024-01-25 13:10:19.329063+00	\N
00000000-0000-0000-0000-000000000000	913	3eLgbRRz6W1PZIBYfT3sWg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-18 08:19:58.70226+00	2024-01-18 08:19:58.702265+00	\N
00000000-0000-0000-0000-000000000000	914	gq7ciXcjiTzCnPDlvLqIZw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-18 09:24:22.640127+00	2024-01-18 09:24:22.640132+00	\N
00000000-0000-0000-0000-000000000000	916	-DsxPT5JzyjJT0kSJtEu6g	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-18 10:32:32.416791+00	2024-01-18 10:32:32.416795+00	\N
00000000-0000-0000-0000-000000000000	918	wTcIkctDsRJi-a2CyLGUIA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-18 11:49:25.997883+00	2024-01-18 11:49:25.997887+00	\N
00000000-0000-0000-0000-000000000000	1003	axSmWbRfCzlZPl1CttuFnA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-25 13:12:30.528321+00	2024-01-25 13:12:30.528325+00	\N
00000000-0000-0000-0000-000000000000	920	j0McJfSnHbo_MGu7hrmTpw	ce61cac2-364a-4d66-8f93-0b25ba769729	f	2024-01-18 12:35:40.463472+00	2024-01-18 12:35:40.463476+00	\N
00000000-0000-0000-0000-000000000000	922	Yo6g4o0pFw3ajE2xa5sgiw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-18 12:50:30.741814+00	2024-01-18 12:50:30.74182+00	\N
00000000-0000-0000-0000-000000000000	925	E_1vQz9I1g-xOF0J_-YZwA	a5c53661-4d09-4805-9190-0a66a7407d31	f	2024-01-18 14:58:58.702471+00	2024-01-18 14:58:58.702475+00	\N
00000000-0000-0000-0000-000000000000	1005	bf9vhbfnoehk3rUklGGxbw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-25 14:11:20.461983+00	2024-01-25 14:11:20.461987+00	\N
00000000-0000-0000-0000-000000000000	1006	QRvE0SvujjGSTIAEL0ccXw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-25 14:13:04.22234+00	2024-01-25 14:13:04.222344+00	\N
00000000-0000-0000-0000-000000000000	1008	4dy35VSEiNy3LP7d5v6MVQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-26 09:07:25.595172+00	2024-01-26 09:07:25.595176+00	\N
00000000-0000-0000-0000-000000000000	1009	y4f-0DDZiqbeswVc1T4oxg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-26 10:11:57.970703+00	2024-01-26 10:11:57.970707+00	\N
00000000-0000-0000-0000-000000000000	1010	mRfRzPpz43c-mNE-6AtVHA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-26 14:11:53.503054+00	2024-01-26 14:11:53.503058+00	\N
00000000-0000-0000-0000-000000000000	1011	rgl0XO8VGHDlAggXnI9jww	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-26 15:42:31.296212+00	2024-01-26 15:42:31.296216+00	\N
00000000-0000-0000-0000-000000000000	1012	yEs0fxhIGK9qMLIV2OuybQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-27 08:44:09.999166+00	2024-01-27 08:44:09.99917+00	\N
00000000-0000-0000-0000-000000000000	1013	QWNI4ycR6OqqmjVd4PdDTQ	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-27 09:48:35.746999+00	2024-01-27 09:48:35.747003+00	\N
00000000-0000-0000-0000-000000000000	1014	nGfHuJfREvYjfvB3afAAxg	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-27 10:48:39.572635+00	2024-01-27 10:48:39.57264+00	\N
00000000-0000-0000-0000-000000000000	1015	RpuLfY_jN-3MMRcfU2lkqw	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-27 13:51:23.862971+00	2024-01-27 13:51:23.862975+00	\N
00000000-0000-0000-0000-000000000000	1016	zKIjlP5FFb_sxXWcZ8wA4A	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-27 13:51:29.008335+00	2024-01-27 13:51:29.008339+00	\N
00000000-0000-0000-0000-000000000000	1017	x5Ms1e2Fif7QjrmEeYPuTA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-28 08:35:32.415841+00	2024-01-28 08:35:32.415845+00	\N
00000000-0000-0000-0000-000000000000	1018	41IBPNFz0uCTZznzMWD0LA	5c2fa081-a226-4ed1-ab79-0945295b6026	f	2024-01-28 09:50:58.203875+00	2024-01-28 09:50:58.203879+00	\N
00000000-0000-0000-0000-000000000000	1019	u0vnIH5R0seO_w0l2lN-Tw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-28 21:52:01.541295+00	2024-01-28 21:52:01.541299+00	\N
00000000-0000-0000-0000-000000000000	1020	HGg1kmPus8vpmFPcWJ6oOQ	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-28 22:52:26.291261+00	2024-01-28 22:52:26.291265+00	\N
00000000-0000-0000-0000-000000000000	1021	vlIMWltNZscPO7Ko_eCODg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-28 23:54:54.242438+00	2024-01-28 23:54:54.242442+00	\N
00000000-0000-0000-0000-000000000000	1022	UOtURLqTtXpp4xMHaPRYgA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-29 07:29:56.218399+00	2024-01-29 07:29:56.218403+00	\N
00000000-0000-0000-0000-000000000000	1023	L62L9qPQ-Q65te6emVoBdA	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-01-29 09:28:11.356351+00	2024-01-29 09:28:11.356355+00	\N
00000000-0000-0000-0000-000000000000	1024	uDteCWshXeFzMNQinb3OFw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 12:55:39.900615+00	2024-01-29 12:55:39.900621+00	\N
00000000-0000-0000-0000-000000000000	1025	kv3I7G1_Jgk0Q-HzWzHCUA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-29 13:52:53.20572+00	2024-01-29 13:52:53.205724+00	\N
00000000-0000-0000-0000-000000000000	1026	N9IxrK6hGNcPiKxecnpu6Q	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 13:55:56.869736+00	2024-01-29 13:55:56.86974+00	\N
00000000-0000-0000-0000-000000000000	1027	ezMQC9ZLdjVr38fQzOgfNA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 14:56:16.874811+00	2024-01-29 14:56:16.874816+00	\N
00000000-0000-0000-0000-000000000000	1028	z2ZLXc_mJ8qfUy62sO9WJg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-01-29 14:59:29.999308+00	2024-01-29 14:59:29.999312+00	\N
00000000-0000-0000-0000-000000000000	1029	19FIgNIwAWIZz_LdC3Z02A	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 15:56:47.380065+00	2024-01-29 15:56:47.38007+00	\N
00000000-0000-0000-0000-000000000000	1030	KnyPBdCCgdu-RGfMeWJySg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-01-29 16:57:05.401819+00	2024-01-29 16:57:05.401823+00	\N
00000000-0000-0000-0000-000000000000	1067	V3HsUw7mYoxPHIZQTy4HkA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-01 13:30:46.913503+00	2024-02-01 13:30:46.913508+00	\N
00000000-0000-0000-0000-000000000000	1068	dRwABIBWvT2mZxm2Y5x30A	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-01 14:56:16.812319+00	2024-02-01 14:56:16.812323+00	\N
00000000-0000-0000-0000-000000000000	1069	CkNAbjix_CDO_x-QFRBaWQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 08:27:18.29098+00	2024-02-02 08:27:18.290984+00	\N
00000000-0000-0000-0000-000000000000	1071	K08MLP29XKSl9O8x4hCfzg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 10:03:40.917377+00	2024-02-02 10:03:40.917381+00	\N
00000000-0000-0000-0000-000000000000	1072	bHOAl08Im105YAa8qnRfwA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 11:04:56.444995+00	2024-02-02 11:04:56.445+00	\N
00000000-0000-0000-0000-000000000000	1073	vBZOuZHPfm_LZ58DaQC73Q	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 12:25:18.864016+00	2024-02-02 12:25:18.86402+00	\N
00000000-0000-0000-0000-000000000000	1074	1VCOuZ93MR495cXiyg96jQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 13:31:05.618284+00	2024-02-02 13:31:05.618288+00	\N
00000000-0000-0000-0000-000000000000	1075	ciP_dknjY2EkjluORWsppw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 14:36:37.050237+00	2024-02-02 14:36:37.050241+00	\N
00000000-0000-0000-0000-000000000000	1076	bOMTVwdAbeCv-bRoKIUaXw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-02 15:43:14.26667+00	2024-02-02 15:43:14.266675+00	\N
00000000-0000-0000-0000-000000000000	1077	5juXisMcf0Hvti2Ug5-2Aw	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-02-02 16:12:26.531537+00	2024-02-02 16:12:26.531541+00	\N
00000000-0000-0000-0000-000000000000	1078	Wp7bkJsjfwgUjVv3sssWCA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-05 08:17:09.020173+00	2024-02-05 08:17:09.020177+00	\N
00000000-0000-0000-0000-000000000000	1079	XNua0iFiZpsjZDBw0tJEjA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-05 09:17:12.732001+00	2024-02-05 09:17:12.732075+00	\N
00000000-0000-0000-0000-000000000000	1080	xgXGptiuCPv-Vrl2QNnQOg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-05 10:17:24.023703+00	2024-02-05 10:17:24.023707+00	\N
00000000-0000-0000-0000-000000000000	1081	Vj2h7VgqLAQBr_H8xpqefQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-05 12:02:22.051748+00	2024-02-05 12:02:22.051752+00	\N
00000000-0000-0000-0000-000000000000	1083	EXoCqcKlqxvRMRdtsu7UkQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-05 14:39:48.798447+00	2024-02-05 14:39:48.798451+00	\N
00000000-0000-0000-0000-000000000000	1086	kTyD20IiOyrCF76GvbR19Q	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-06 08:19:45.694479+00	2024-02-06 08:19:45.694483+00	\N
00000000-0000-0000-0000-000000000000	1087	VcQC6i6OaKdQyMHx-56K9Q	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-06 09:01:19.997017+00	2024-02-06 09:01:19.997021+00	\N
00000000-0000-0000-0000-000000000000	1089	bwvtdVkqH1e3QPvHdpdw6Q	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-06 09:20:34.807843+00	2024-02-06 09:20:34.807847+00	\N
00000000-0000-0000-0000-000000000000	1091	TJCvnogk0cAvfJu2bMRzMw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-06 12:24:24.498304+00	2024-02-06 12:24:24.498308+00	\N
00000000-0000-0000-0000-000000000000	1092	ICQ95QKPsJ1bp9_YICsxBg	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-02-06 12:41:17.096994+00	2024-02-06 12:41:17.096998+00	\N
00000000-0000-0000-0000-000000000000	1093	tNo1X9KFyZButdQSt6aCPA	f8dc6800-6923-46b4-bb8a-77f93502e7bc	f	2024-02-06 13:42:04.596728+00	2024-02-06 13:42:04.596732+00	\N
00000000-0000-0000-0000-000000000000	1094	UXDsfXjYUfxk0Rh2nKIIUA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-06 13:54:01.541556+00	2024-02-06 13:54:01.54156+00	\N
00000000-0000-0000-0000-000000000000	1095	8gKl1vXBdVTrqN1WOCk1Yw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-06 15:23:14.696768+00	2024-02-06 15:23:14.696772+00	\N
00000000-0000-0000-0000-000000000000	1097	BniJVwH45-nQxrCVGsqmlQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-07 08:00:34.553367+00	2024-02-07 08:00:34.553372+00	\N
00000000-0000-0000-0000-000000000000	1100	cOnLFLWsw7w4UMta065S5w	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-07 10:12:33.364383+00	2024-02-07 10:12:33.364387+00	\N
00000000-0000-0000-0000-000000000000	1102	1__t3Rba3tiJVwUEkE2CZw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-07 12:01:56.645848+00	2024-02-07 12:01:56.645851+00	\N
00000000-0000-0000-0000-000000000000	1107	Vy-XImEzCxn5Y1JAcZw9IA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-07 15:57:07.408441+00	2024-02-07 15:57:07.408446+00	\N
00000000-0000-0000-0000-000000000000	1108	FeTjnrV0EQHAZnXOUitUXQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-07 17:06:22.45444+00	2024-02-07 17:06:22.454446+00	\N
00000000-0000-0000-0000-000000000000	1109	qxZ0URWjoXTJ2LFM5E8cdQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-08 09:02:36.494748+00	2024-02-08 09:02:36.494755+00	\N
00000000-0000-0000-0000-000000000000	1111	ucSI4EArFM4iu-UkbzrW7g	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-08 09:42:10.858511+00	2024-02-08 09:42:10.858515+00	\N
00000000-0000-0000-0000-000000000000	1112	hQvcpYsiWOGk_4XLrfTEeQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-08 10:18:17.732572+00	2024-02-08 10:18:17.732576+00	\N
00000000-0000-0000-0000-000000000000	1115	ttUhJ5tTccg2DJFUtnkkWA	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-08 12:34:05.89489+00	2024-02-08 12:34:05.894895+00	\N
00000000-0000-0000-0000-000000000000	1116	QZjKcR7_j9KkWozu3UE3Zg	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-08 12:49:22.540214+00	2024-02-08 12:49:22.540219+00	\N
00000000-0000-0000-0000-000000000000	1117	SvZyhDJtLlNRg4XHsaFgmA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-08 13:51:58.23474+00	2024-02-08 13:51:58.234745+00	\N
00000000-0000-0000-0000-000000000000	1121	aK06bQBqY_FG0QwLyciWtQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-09 08:45:55.404068+00	2024-02-09 08:45:55.404072+00	\N
00000000-0000-0000-0000-000000000000	1122	aiN8BFWPAmAN_NYusp1riw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-09 10:52:36.947553+00	2024-02-09 10:52:36.947557+00	\N
00000000-0000-0000-0000-000000000000	1123	jh3sEBgMjqYyDBDkhYbjRA	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-09 12:21:26.596077+00	2024-02-09 12:21:26.596081+00	\N
00000000-0000-0000-0000-000000000000	1124	CPWebtwlBdDGLiaAISU1cQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-09 13:25:33.384116+00	2024-02-09 13:25:33.38412+00	\N
00000000-0000-0000-0000-000000000000	1125	Rzl-zilTspYA82cRc7uE4w	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-09 15:04:38.637444+00	2024-02-09 15:04:38.637448+00	\N
00000000-0000-0000-0000-000000000000	1128	igCaAaapB2EgQ64yMxwagg	356537c3-fb03-44f4-8e81-7871ad36760f	f	2024-02-12 08:29:00.691463+00	2024-02-12 08:29:00.691467+00	\N
00000000-0000-0000-0000-000000000000	1129	OFgx-fVAQDgw3-63A59mHg	0f263b32-fad7-4b16-be21-370b63cb7797	f	2024-02-12 09:02:55.285428+00	2024-02-12 09:02:55.285432+00	\N
00000000-0000-0000-0000-000000000000	1131	Nt_bg_PY8eNk79lEaNXmpw	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-12 12:38:48.065038+00	2024-02-12 12:38:48.065042+00	\N
00000000-0000-0000-0000-000000000000	1136	Yo17Ai8EzDSvO2d39FMMzw	ef2ccc58-d6ef-4af7-a456-858a39200ebd	f	2024-02-13 09:47:54.660408+00	2024-02-13 09:47:54.660412+00	\N
00000000-0000-0000-0000-000000000000	1139	m9xOaZDtxzY42pqFECgfzA	356537c3-fb03-44f4-8e81-7871ad36760f	f	2024-02-13 13:54:25.515183+00	2024-02-13 13:54:25.515187+00	\N
00000000-0000-0000-0000-000000000000	1152	L7A-3UhLPSssr9fNJHJU-A	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-02-15 10:00:20.777097+00	2024-02-15 10:00:20.777101+00	\N
00000000-0000-0000-0000-000000000000	1153	R2fKolea-zQGaMOnVNMohw	48aab4f5-ca7b-4cca-b897-67c46f29c36b	f	2024-02-15 10:03:11.686188+00	2024-02-15 10:03:11.686192+00	\N
00000000-0000-0000-0000-000000000000	1154	HX5RY1RUf-OtX_Fz5WMufQ	cea2655a-0fc8-4b27-94ad-1a7fc556e56b	f	2024-02-15 10:12:53.022008+00	2024-02-15 10:12:53.022012+00	\N
00000000-0000-0000-0000-000000000000	1155	szbxJy-4Hj_0vwg8NUGZyA	48aab4f5-ca7b-4cca-b897-67c46f29c36b	f	2024-02-15 12:26:27.244216+00	2024-02-15 12:26:27.24422+00	\N
00000000-0000-0000-0000-000000000000	1156	-saLy3Ns-IwTRbNJu-iTrg	ce2e99bc-2128-42df-b31f-55f2c035e2df	f	2024-02-15 16:22:36.388819+00	2024-02-15 16:22:36.388822+00	\N
00000000-0000-0000-0000-000000000000	1157	qzQ6tTNZYp1QvWueVzjz7Q	10f95aa3-fb95-41eb-b754-5f729a092e30	f	2024-02-15 16:28:47.224605+00	2024-02-15 16:28:47.224607+00	\N
00000000-0000-0000-0000-000000000000	1158	uZk60FJ7vf9lFADkf9-3lQ	10f95aa3-fb95-41eb-b754-5f729a092e30	f	2024-02-15 16:30:43.112401+00	2024-02-15 16:30:43.112404+00	\N
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
00000000-0000-0000-0000-000000000000	8c9071ba-26e0-47d1-91d3-809f4a141ddc		service_role	swissgeol@swisstopo.ch	$2a$10$HxnrnsmkEIgDTFPZjZ2.6OkyB2UZMeyU3HRZso.BLwmYES.RuYr4q	2023-07-05 14:33:34.546987+00	2023-07-05 14:33:22.875924+00		2023-07-05 14:33:22.875924+00		\N			\N	2023-07-06 09:34:57.524166+00	{"provider": "email", "providers": ["email"]}	{"lang": "de"}	f	2023-07-05 14:33:22.873098+00	2023-07-06 09:34:57.525545+00	\N	\N			\N		0	\N		\N
00000000-0000-0000-0000-000000000000	ce2e99bc-2128-42df-b31f-55f2c035e2df		service_role	alex.graf@ebp.ch	$2a$10$eg46/e17aaj82CrQrl.dEOHdLOrSSXRPDGomDoz5iLbxypDeQf8Ya	2024-01-16 15:47:50.464379+00	2024-01-16 15:47:30.080659+00		2024-01-16 15:47:30.080659+00		2024-01-17 06:39:58.427439+00			\N	2024-02-15 16:22:36.388783+00	{"provider": "email", "providers": ["email"]}	{"lang": "de"}	f	2024-01-16 15:47:30.064064+00	2024-02-15 16:22:36.397778+00	\N	\N			\N		0	\N		\N
00000000-0000-0000-0000-000000000000	10f95aa3-fb95-41eb-b754-5f729a092e30		service_role	admin@assets.sg	$2a$10$A7M8pJONkMjHq/qcw6ZFZ.rXykkWRq/wk/V/Jvyn9Az187ZLlct2W	2024-02-15 16:28:47.224034+00	2024-02-15 16:27:23.057106+00		2024-02-15 16:27:23.057106+00		2024-02-15 16:30:33.658008+00			\N	2024-02-15 16:30:43.112344+00	{"provider": "email", "providers": ["email"]}	{"lang": "de"}	f	2024-02-15 16:27:23.053463+00	2024-02-15 16:31:09.399638+00	\N	\N			\N		0	\N		\N
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
8c9071ba-26e0-47d1-91d3-809f4a141ddc	viewer
ce2e99bc-2128-42df-b31f-55f2c035e2df	admin
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

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1158, true);


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
-- TOC entry 4344 (class 2606 OID 17754)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4347 (class 2606 OID 17756)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (provider, id);


--
-- TOC entry 4350 (class 2606 OID 17758)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 4355 (class 2606 OID 17760)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4363 (class 2606 OID 17762)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4365 (class 2606 OID 17764)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4378 (class 2606 OID 17766)
-- Name: asset_contact asset_contact_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_contact
    ADD CONSTRAINT asset_contact_pkey PRIMARY KEY (asset_id, contact_id, role);


--
-- TOC entry 4380 (class 2606 OID 17768)
-- Name: asset_file asset_file_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_file
    ADD CONSTRAINT asset_file_pkey PRIMARY KEY (asset_id, file_id);


--
-- TOC entry 4382 (class 2606 OID 17770)
-- Name: asset_format_composition asset_format_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition
    ADD CONSTRAINT asset_format_composition_pkey PRIMARY KEY (asset_format_composition_id);


--
-- TOC entry 4384 (class 2606 OID 17772)
-- Name: asset_format_item asset_format_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_item
    ADD CONSTRAINT asset_format_item_pkey PRIMARY KEY (asset_format_item_code);


--
-- TOC entry 4386 (class 2606 OID 17774)
-- Name: asset_internal_project asset_internal_project_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_internal_project
    ADD CONSTRAINT asset_internal_project_pkey PRIMARY KEY (asset_id, internal_project_id);


--
-- TOC entry 4388 (class 2606 OID 17776)
-- Name: asset_kind_composition asset_kind_composition_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition
    ADD CONSTRAINT asset_kind_composition_pkey PRIMARY KEY (asset_kind_composition_id);


--
-- TOC entry 4390 (class 2606 OID 17778)
-- Name: asset_kind_item asset_kind_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_item
    ADD CONSTRAINT asset_kind_item_pkey PRIMARY KEY (asset_kind_item_code);


--
-- TOC entry 4392 (class 2606 OID 17780)
-- Name: asset_object_info asset_object_info_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info
    ADD CONSTRAINT asset_object_info_pkey PRIMARY KEY (asset_object_info_id);


--
-- TOC entry 4376 (class 2606 OID 17782)
-- Name: asset asset_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_pkey PRIMARY KEY (asset_id);


--
-- TOC entry 4394 (class 2606 OID 17784)
-- Name: asset_publication asset_publication_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_publication
    ADD CONSTRAINT asset_publication_pkey PRIMARY KEY (asset_id, publication_id);


--
-- TOC entry 4398 (class 2606 OID 17786)
-- Name: asset_user_favourite asset_user_favourite_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user_favourite
    ADD CONSTRAINT asset_user_favourite_pkey PRIMARY KEY (asset_user_id, asset_id);


--
-- TOC entry 4396 (class 2606 OID 17788)
-- Name: asset_user asset_user_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user
    ADD CONSTRAINT asset_user_pkey PRIMARY KEY (id);


--
-- TOC entry 4400 (class 2606 OID 17790)
-- Name: asset_x_asset_y asset_x_asset_y_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_x_asset_y
    ADD CONSTRAINT asset_x_asset_y_pkey PRIMARY KEY (asset_x_id, asset_y_id);


--
-- TOC entry 4404 (class 2606 OID 17792)
-- Name: auto_cat_label_item auto_cat_label_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat_label_item
    ADD CONSTRAINT auto_cat_label_item_pkey PRIMARY KEY (asset_cat_label_item_code);


--
-- TOC entry 4402 (class 2606 OID 17794)
-- Name: auto_cat auto_cat_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat
    ADD CONSTRAINT auto_cat_pkey PRIMARY KEY (auto_cat_id);


--
-- TOC entry 4406 (class 2606 OID 17796)
-- Name: auto_object_cat_item auto_object_cat_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_object_cat_item
    ADD CONSTRAINT auto_object_cat_item_pkey PRIMARY KEY (auto_object_cat_item_code);


--
-- TOC entry 4410 (class 2606 OID 17798)
-- Name: contact_kind_item contact_kind_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact_kind_item
    ADD CONSTRAINT contact_kind_item_pkey PRIMARY KEY (contact_kind_item_code);


--
-- TOC entry 4408 (class 2606 OID 17800)
-- Name: contact contact_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_pkey PRIMARY KEY (contact_id);


--
-- TOC entry 4413 (class 2606 OID 17802)
-- Name: file file_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (file_id);


--
-- TOC entry 4415 (class 2606 OID 17804)
-- Name: geom_quality_item geom_quality_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.geom_quality_item
    ADD CONSTRAINT geom_quality_item_pkey PRIMARY KEY (geom_quality_item_code);


--
-- TOC entry 4417 (class 2606 OID 17806)
-- Name: id id_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.id
    ADD CONSTRAINT id_pkey PRIMARY KEY (id_id);


--
-- TOC entry 4419 (class 2606 OID 17808)
-- Name: internal_project internal_project_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_project
    ADD CONSTRAINT internal_project_pkey PRIMARY KEY (internal_project_id);


--
-- TOC entry 4421 (class 2606 OID 17810)
-- Name: internal_use internal_use_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_use
    ADD CONSTRAINT internal_use_pkey PRIMARY KEY (internal_use_id);


--
-- TOC entry 4423 (class 2606 OID 17812)
-- Name: language_item language_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.language_item
    ADD CONSTRAINT language_item_pkey PRIMARY KEY (language_item_code);


--
-- TOC entry 4427 (class 2606 OID 17814)
-- Name: legal_doc_item legal_doc_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc_item
    ADD CONSTRAINT legal_doc_item_pkey PRIMARY KEY (legal_doc_item_code);


--
-- TOC entry 4425 (class 2606 OID 17816)
-- Name: legal_doc legal_doc_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc
    ADD CONSTRAINT legal_doc_pkey PRIMARY KEY (legal_doc_id);


--
-- TOC entry 4429 (class 2606 OID 17818)
-- Name: man_cat_label_item man_cat_label_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.man_cat_label_item
    ADD CONSTRAINT man_cat_label_item_pkey PRIMARY KEY (man_cat_label_item_code);


--
-- TOC entry 4432 (class 2606 OID 17820)
-- Name: nat_rel_item nat_rel_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.nat_rel_item
    ADD CONSTRAINT nat_rel_item_pkey PRIMARY KEY (nat_rel_item_code);


--
-- TOC entry 4434 (class 2606 OID 17822)
-- Name: pub_channel_item pub_channel_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.pub_channel_item
    ADD CONSTRAINT pub_channel_item_pkey PRIMARY KEY (pub_channel_item_code);


--
-- TOC entry 4436 (class 2606 OID 17824)
-- Name: public_use public_use_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.public_use
    ADD CONSTRAINT public_use_pkey PRIMARY KEY (public_use_id);


--
-- TOC entry 4438 (class 2606 OID 17826)
-- Name: publication publication_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT publication_pkey PRIMARY KEY (publication_id);


--
-- TOC entry 4440 (class 2606 OID 17828)
-- Name: status_asset_use_item status_asset_use_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_asset_use_item
    ADD CONSTRAINT status_asset_use_item_pkey PRIMARY KEY (status_asset_use_item_code);


--
-- TOC entry 4444 (class 2606 OID 17830)
-- Name: status_work_item status_work_item_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work_item
    ADD CONSTRAINT status_work_item_pkey PRIMARY KEY (status_work_item_code);


--
-- TOC entry 4442 (class 2606 OID 17832)
-- Name: status_work status_work_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work
    ADD CONSTRAINT status_work_pkey PRIMARY KEY (status_work_id);


--
-- TOC entry 4368 (class 2606 OID 17834)
-- Name: study_area study_area_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area
    ADD CONSTRAINT study_area_pkey PRIMARY KEY (study_area_id);


--
-- TOC entry 4371 (class 2606 OID 17836)
-- Name: study_location study_location_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location
    ADD CONSTRAINT study_location_pkey PRIMARY KEY (study_location_id);


--
-- TOC entry 4374 (class 2606 OID 17838)
-- Name: study_trace study_trace_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace
    ADD CONSTRAINT study_trace_pkey PRIMARY KEY (study_trace_id);


--
-- TOC entry 4446 (class 2606 OID 17840)
-- Name: type_nat_rel type_nat_rel_pkey; Type: CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.type_nat_rel
    ADD CONSTRAINT type_nat_rel_pkey PRIMARY KEY (type_nat_rel_id);


--
-- TOC entry 4345 (class 1259 OID 17841)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 4348 (class 1259 OID 17842)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 4351 (class 1259 OID 17843)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 4352 (class 1259 OID 17844)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 4353 (class 1259 OID 17845)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 4356 (class 1259 OID 17846)
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX refresh_tokens_token_idx ON auth.refresh_tokens USING btree (token);


--
-- TOC entry 4357 (class 1259 OID 17847)
-- Name: refresh_tokens_token_unique; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token);


--
-- TOC entry 4358 (class 1259 OID 17848)
-- Name: schema_migrations_version_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX schema_migrations_version_idx ON auth.schema_migrations USING btree (version);


--
-- TOC entry 4359 (class 1259 OID 17849)
-- Name: users_email_key; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX users_email_key ON auth.users USING btree (email);


--
-- TOC entry 4360 (class 1259 OID 17850)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 4361 (class 1259 OID 17851)
-- Name: users_phone_key; Type: INDEX; Schema: auth; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone);


--
-- TOC entry 4411 (class 1259 OID 17852)
-- Name: file_file_name_key; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX file_file_name_key ON public.file USING btree (file_name);


--
-- TOC entry 4430 (class 1259 OID 17853)
-- Name: man_cat_label_ref_asset_id_man_cat_label_item_code_key; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE UNIQUE INDEX man_cat_label_ref_asset_id_man_cat_label_item_code_key ON public.man_cat_label_ref USING btree (asset_id, man_cat_label_item_code);


--
-- TOC entry 4366 (class 1259 OID 17854)
-- Name: study_area_geom_idx; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE INDEX study_area_geom_idx ON public.study_area USING gist (geom);


--
-- TOC entry 4369 (class 1259 OID 17855)
-- Name: study_location_geom_idx; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE INDEX study_location_geom_idx ON public.study_location USING gist (geom);


--
-- TOC entry 4372 (class 1259 OID 17856)
-- Name: study_trace_geom_idx; Type: INDEX; Schema: public; Owner: asset-swissgeol
--

CREATE INDEX study_trace_geom_idx ON public.study_trace USING gist (geom);


--
-- TOC entry 4447 (class 2606 OID 17857)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4448 (class 2606 OID 17862)
-- Name: refresh_tokens refresh_tokens_parent_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: asset-swissgeol
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_parent_fkey FOREIGN KEY (parent) REFERENCES auth.refresh_tokens(token);


--
-- TOC entry 4455 (class 2606 OID 17867)
-- Name: asset asset_asset_format_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_format_item_code_fkey FOREIGN KEY (asset_format_item_code) REFERENCES public.asset_format_item(asset_format_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4456 (class 2606 OID 17872)
-- Name: asset asset_asset_kind_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_kind_item_code_fkey FOREIGN KEY (asset_kind_item_code) REFERENCES public.asset_kind_item(asset_kind_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4457 (class 2606 OID 17877)
-- Name: asset asset_asset_main_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_asset_main_id_fkey FOREIGN KEY (asset_main_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4461 (class 2606 OID 17882)
-- Name: asset_contact asset_contact_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_contact
    ADD CONSTRAINT asset_contact_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4462 (class 2606 OID 17887)
-- Name: asset_contact asset_contact_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_contact
    ADD CONSTRAINT asset_contact_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contact(contact_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4463 (class 2606 OID 17892)
-- Name: asset_file asset_file_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_file
    ADD CONSTRAINT asset_file_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4464 (class 2606 OID 17897)
-- Name: asset_file asset_file_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_file
    ADD CONSTRAINT asset_file_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file(file_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4465 (class 2606 OID 17902)
-- Name: asset_format_composition asset_format_composition_asset_format_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition
    ADD CONSTRAINT asset_format_composition_asset_format_item_code_fkey FOREIGN KEY (asset_format_item_code) REFERENCES public.asset_format_item(asset_format_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4466 (class 2606 OID 17907)
-- Name: asset_format_composition asset_format_composition_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_format_composition
    ADD CONSTRAINT asset_format_composition_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4467 (class 2606 OID 17912)
-- Name: asset_internal_project asset_internal_project_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_internal_project
    ADD CONSTRAINT asset_internal_project_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4468 (class 2606 OID 17917)
-- Name: asset_internal_project asset_internal_project_internal_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_internal_project
    ADD CONSTRAINT asset_internal_project_internal_project_id_fkey FOREIGN KEY (internal_project_id) REFERENCES public.internal_project(internal_project_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4458 (class 2606 OID 17922)
-- Name: asset asset_internal_use_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_internal_use_id_fkey FOREIGN KEY (internal_use_id) REFERENCES public.internal_use(internal_use_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4469 (class 2606 OID 17927)
-- Name: asset_kind_composition asset_kind_composition_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition
    ADD CONSTRAINT asset_kind_composition_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4470 (class 2606 OID 17932)
-- Name: asset_kind_composition asset_kind_composition_asset_kind_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_kind_composition
    ADD CONSTRAINT asset_kind_composition_asset_kind_item_code_fkey FOREIGN KEY (asset_kind_item_code) REFERENCES public.asset_kind_item(asset_kind_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4459 (class 2606 OID 17937)
-- Name: asset asset_language_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_language_item_code_fkey FOREIGN KEY (language_item_code) REFERENCES public.language_item(language_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4471 (class 2606 OID 17942)
-- Name: asset_object_info asset_object_info_auto_object_cat_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info
    ADD CONSTRAINT asset_object_info_auto_object_cat_item_code_fkey FOREIGN KEY (auto_object_cat_item_code) REFERENCES public.auto_object_cat_item(auto_object_cat_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4472 (class 2606 OID 17947)
-- Name: asset_object_info asset_object_info_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_object_info
    ADD CONSTRAINT asset_object_info_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file(file_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4460 (class 2606 OID 17952)
-- Name: asset asset_public_use_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset
    ADD CONSTRAINT asset_public_use_id_fkey FOREIGN KEY (public_use_id) REFERENCES public.public_use(public_use_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4473 (class 2606 OID 17957)
-- Name: asset_publication asset_publication_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_publication
    ADD CONSTRAINT asset_publication_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4474 (class 2606 OID 17962)
-- Name: asset_publication asset_publication_publication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_publication
    ADD CONSTRAINT asset_publication_publication_id_fkey FOREIGN KEY (publication_id) REFERENCES public.publication(publication_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4476 (class 2606 OID 17967)
-- Name: asset_user_favourite asset_user_favourite_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user_favourite
    ADD CONSTRAINT asset_user_favourite_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4477 (class 2606 OID 17972)
-- Name: asset_user_favourite asset_user_favourite_asset_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user_favourite
    ADD CONSTRAINT asset_user_favourite_asset_user_id_fkey FOREIGN KEY (asset_user_id) REFERENCES public.asset_user(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4475 (class 2606 OID 17977)
-- Name: asset_user asset_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_user
    ADD CONSTRAINT asset_user_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4478 (class 2606 OID 17982)
-- Name: asset_x_asset_y asset_x_asset_y_asset_x_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_x_asset_y
    ADD CONSTRAINT asset_x_asset_y_asset_x_id_fkey FOREIGN KEY (asset_x_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4479 (class 2606 OID 17987)
-- Name: asset_x_asset_y asset_x_asset_y_asset_y_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.asset_x_asset_y
    ADD CONSTRAINT asset_x_asset_y_asset_y_id_fkey FOREIGN KEY (asset_y_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4480 (class 2606 OID 17992)
-- Name: auto_cat auto_cat_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat
    ADD CONSTRAINT auto_cat_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4481 (class 2606 OID 17997)
-- Name: auto_cat auto_cat_auto_cat_label_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.auto_cat
    ADD CONSTRAINT auto_cat_auto_cat_label_item_code_fkey FOREIGN KEY (auto_cat_label_item_code) REFERENCES public.auto_cat_label_item(asset_cat_label_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4482 (class 2606 OID 18002)
-- Name: contact contact_contact_kind_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.contact
    ADD CONSTRAINT contact_contact_kind_item_code_fkey FOREIGN KEY (contact_kind_item_code) REFERENCES public.contact_kind_item(contact_kind_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4483 (class 2606 OID 18007)
-- Name: id id_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.id
    ADD CONSTRAINT id_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4484 (class 2606 OID 18012)
-- Name: internal_use internal_use_status_asset_use_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.internal_use
    ADD CONSTRAINT internal_use_status_asset_use_item_code_fkey FOREIGN KEY (status_asset_use_item_code) REFERENCES public.status_asset_use_item(status_asset_use_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4485 (class 2606 OID 18017)
-- Name: legal_doc legal_doc_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc
    ADD CONSTRAINT legal_doc_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4486 (class 2606 OID 18022)
-- Name: legal_doc legal_doc_legal_doc_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.legal_doc
    ADD CONSTRAINT legal_doc_legal_doc_item_code_fkey FOREIGN KEY (legal_doc_item_code) REFERENCES public.legal_doc_item(legal_doc_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4487 (class 2606 OID 18027)
-- Name: man_cat_label_ref man_cat_label_ref_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.man_cat_label_ref
    ADD CONSTRAINT man_cat_label_ref_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4488 (class 2606 OID 18032)
-- Name: man_cat_label_ref man_cat_label_ref_man_cat_label_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.man_cat_label_ref
    ADD CONSTRAINT man_cat_label_ref_man_cat_label_item_code_fkey FOREIGN KEY (man_cat_label_item_code) REFERENCES public.man_cat_label_item(man_cat_label_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4489 (class 2606 OID 18037)
-- Name: public_use public_use_status_asset_use_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.public_use
    ADD CONSTRAINT public_use_status_asset_use_item_code_fkey FOREIGN KEY (status_asset_use_item_code) REFERENCES public.status_asset_use_item(status_asset_use_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4490 (class 2606 OID 18042)
-- Name: publication publication_pub_channel_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.publication
    ADD CONSTRAINT publication_pub_channel_item_code_fkey FOREIGN KEY (pub_channel_item_code) REFERENCES public.pub_channel_item(pub_channel_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4491 (class 2606 OID 18047)
-- Name: status_work status_work_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work
    ADD CONSTRAINT status_work_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4492 (class 2606 OID 18052)
-- Name: status_work status_work_status_work_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.status_work
    ADD CONSTRAINT status_work_status_work_item_code_fkey FOREIGN KEY (status_work_item_code) REFERENCES public.status_work_item(status_work_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4449 (class 2606 OID 18057)
-- Name: study_area study_area_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area
    ADD CONSTRAINT study_area_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4450 (class 2606 OID 18062)
-- Name: study_area study_area_geom_quality_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_area
    ADD CONSTRAINT study_area_geom_quality_item_code_fkey FOREIGN KEY (geom_quality_item_code) REFERENCES public.geom_quality_item(geom_quality_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4451 (class 2606 OID 18067)
-- Name: study_location study_location_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location
    ADD CONSTRAINT study_location_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4452 (class 2606 OID 18072)
-- Name: study_location study_location_geom_quality_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_location
    ADD CONSTRAINT study_location_geom_quality_item_code_fkey FOREIGN KEY (geom_quality_item_code) REFERENCES public.geom_quality_item(geom_quality_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4453 (class 2606 OID 18077)
-- Name: study_trace study_trace_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace
    ADD CONSTRAINT study_trace_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4454 (class 2606 OID 18082)
-- Name: study_trace study_trace_geom_quality_item_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.study_trace
    ADD CONSTRAINT study_trace_geom_quality_item_code_fkey FOREIGN KEY (geom_quality_item_code) REFERENCES public.geom_quality_item(geom_quality_item_code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4493 (class 2606 OID 18087)
-- Name: type_nat_rel type_nat_rel_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asset-swissgeol
--

ALTER TABLE ONLY public.type_nat_rel
    ADD CONSTRAINT type_nat_rel_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.asset(asset_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4494 (class 2606 OID 18092)
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


-- Completed on 2024-02-20 15:30:27 UTC

--
-- PostgreSQL database dump complete
--

